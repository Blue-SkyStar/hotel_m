require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs-extra');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendPushNotification } = require('./utils/firebase');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// --- SSE Realtime Setup ---
let clients = [];
const broadcastUpdate = (table) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ type: 'UPDATE', table })}\n\n`));
};

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Helper functions for DB
// Replaced db.json file ops with MySQL pool
const pool = require('./config/db');
const { verifyToken } = require('./config/authMiddleware');

// ─── Razorpay Setup ───────────────────────────────────────────────────────────
let Razorpay;
let razorpayInstance;
let RAZORPAY_LIVE = false;

try {
    Razorpay = require('razorpay');
    const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    if (KEY_ID && KEY_ID !== 'rzp_test_XXXXXXXXXXXXXXXX') {
        razorpayInstance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
        RAZORPAY_LIVE = true;
        console.log('✅ Razorpay initialized with key:', KEY_ID.substring(0, 14) + '...');
    } else {
        console.log('⚠️  Razorpay keys not set — running in DEMO mode (payments will simulate)');
    }
} catch (e) {
    console.log('⚠️  Razorpay package not found, running in DEMO mode');
}

// POST /api/razorpay/create-order
app.post('/api/razorpay/create-order', async (req, res) => {
    const { amount = 1000, currency = 'INR', receipt = 'rcpt_' + Date.now() } = req.body;

    if (!RAZORPAY_LIVE) {
        // DEMO mode: return a fake order so the flow still works
        return res.json({
            success: true,
            demo: true,
            order: {
                id: 'demo_order_' + Date.now(),
                amount: amount * 100,
                currency,
                receipt
            },
            key_id: 'rzp_test_demo'
        });
    }

    try {
        const order = await razorpayInstance.orders.create({
            amount: amount * 100, // paise
            currency,
            receipt,
            payment_capture: 1
        });
        res.json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error('Razorpay order error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/razorpay/verify
app.post('/api/razorpay/verify', async (req, res) => {
    const { order_id, payment_id, signature, demo } = req.body;

    if (demo) {
        // Demo mode — always succeed
        return res.json({ success: true, verified: true, demo: true });
    }

    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature === signature) {
        res.json({ success: true, verified: true });
    } else {
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

// ─── AUTH API ─────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                const secret = process.env.JWT_SECRET || 'task_jwt_secretpasswordshouldbestrongasPi3.141592';
                const token = jwt.sign({ username: user.username, role: user.role }, secret, { expiresIn: '1d' });
                
                res.cookie('jwt', token, { 
                    httpOnly: true, 
                    secure: process.env.NODE_ENV === 'production', 
                    sameSite: 'strict', 
                    maxAge: 24 * 60 * 60 * 1000 
                });
                
                res.json({ success: true, user: { username: user.username, role: user.role } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { rows: existing } = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users ("username", "email", "password", "role") VALUES ($1, $2, $3, $4)', [username, email, hashedPassword, 'student']);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('jwt');
    res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/fcm-token', verifyToken, async (req, res) => {
    const { token } = req.body;
    try {
        await pool.query('UPDATE users SET fcm_token = $1 WHERE username = $2', [token, req.user.username]);
        res.json({ success: true });
    } catch (err) {
        console.error('FCM Token Save Error:', err);
        res.status(500).json({ success: false });
    }
});

// ─── DATA API & REALTIME ──────────────────────────────────────────────────────
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push({ id: Date.now(), res });
    req.on('close', () => {
        clients = clients.filter(c => c.res !== res);
    });
});

app.get('/api/data/:key', verifyToken, async (req, res) => {
    const { key } = req.params;
    try {
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info'];
        if (!allowedTables.includes(key)) {
            return res.status(400).json({ success: false, message: 'Invalid table query' });
        }
        
        const { rows } = await pool.query(`SELECT * FROM ${key}`);
        const parsedRows = rows.map(r => {
            if (r.facilities && typeof r.facilities === 'string') {
                try { r.facilities = JSON.parse(r.facilities); } catch (e) {}
            }
            return r;
        });
        res.json(parsedRows);
    } catch (err) {
        console.error(`Error fetching from ${key}:`, err);
        res.status(500).json([]);
    }
});

app.post('/api/data/:key', verifyToken, async (req, res) => {
    const { key } = req.params;
    const item = req.body;
    try {
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info'];
        if (!allowedTables.includes(key)) return res.status(400).json({ success: false, message: 'Invalid table' });

        if (!item.id && key !== 'users') {
             item.id = Date.now().toString(); // Consistent ID generation
        }

        if (item.facilities && Array.isArray(item.facilities)) {
             item.facilities = JSON.stringify(item.facilities);
        }

        // --- ROOM APPLICATION ENGINE (Capacity, Waitlist, Duplicates) ---
        if (key === 'applications') {
            // Check Room Capacity
            const { rows: roomRows } = await pool.query('SELECT capacity, occupied, number FROM rooms WHERE id = $1', [item.roomId]);
            if (roomRows.length > 0) {
                const room = roomRows[0];
                if (room.occupied >= room.capacity) {
                    // Room full. Did user consent to waitlisting yet?
                    if (!item.forceWaitlist) {
                        return res.json({ 
                            success: false, 
                            requireConfirmation: true, 
                            message: `Room ${room.number} is completely full! Your 2nd Choice might be available. Do you want to Waitlist for this room instead?` 
                        });
                    } else {
                        item.status = 'Waitlisted'; // Override status
                    }
                }
            }
            delete item.forceWaitlist; // Strip dummy flag before inserting
        }

        const cols = Object.keys(item);
        const vals = Object.values(item);
        if (cols.length > 0) {
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
            // Double quotes around columns preserve cases (e.g. "orderId")
            await pool.query(`INSERT INTO ${key} ("${cols.join('", "')}") VALUES (${placeholders})`, vals);
        }
        
        
        if (item.facilities && typeof item.facilities === 'string') {
             try { item.facilities = JSON.parse(item.facilities); } catch (e) {}
        }
        
        // --- FCM PUSH NOTIFICATION TRIGGER ---
        if (key === 'complaints') {
            const { rows: admins } = await pool.query('SELECT fcm_token FROM users WHERE role IN (\'admin\', \'warden\') AND fcm_token IS NOT NULL');
            const adminTokens = admins.map(a => a.fcm_token);
            for (let tok of adminTokens) {
                sendPushNotification(tok, 'New Complaint Raised!', `Student ${item.student} reported a new ${item.category} issue.`);
            }
        }
        if (key === 'payments') {
            // E.g., Notify admin a payment was made
            const { rows: admins } = await pool.query('SELECT fcm_token FROM users WHERE role IN (\'admin\', \'warden\') AND fcm_token IS NOT NULL');
            for (let adm of admins) {
                if(adm.fcm_token) sendPushNotification(adm.fcm_token, 'Payment Received', `Payment of ₹${item.amount} from ${item.student} received.`);
            }
        }
        
        broadcastUpdate(key); // Notify all live dashboards
        res.json({ success: true, item });
    } catch (err) {
        // Catch PostgreSQL Unique Constraint Violation for Applications
        if (err.code === '23505' && key === 'applications') {
            const { rows: exist } = await pool.query('SELECT id FROM applications WHERE "student" = $1 AND "status" IN (\'Pending Review\', \'Approved\', \'Waitlisted\')', [item.student]);
            const existingAppId = exist.length ? exist[0].id : null;
            return res.status(409).json({ success: false, duplicate: true, existingAppId, message: "You already have an active application." });
        }
        console.error(`Error inserting into ${key}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/data/:key/:id', verifyToken, async (req, res) => {
    const { key, id } = req.params;
    const updatedItem = req.body;
    try {
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info'];
        if (!allowedTables.includes(key)) return res.status(400).json({ success: false, message: 'Invalid table' });

        if (updatedItem.facilities && Array.isArray(updatedItem.facilities)) {
             updatedItem.facilities = JSON.stringify(updatedItem.facilities);
        }

        // --- ROOM APPLICATION ENGINE (Capacity checks during Preference Swapping) ---
        if (key === 'applications' && updatedItem.roomId) {
            const { rows: roomRows } = await pool.query('SELECT capacity, occupied, number FROM rooms WHERE id = $1', [updatedItem.roomId]);
            if (roomRows.length > 0) {
                const room = roomRows[0];
                if (room.occupied >= room.capacity) {
                    if (!updatedItem.forceWaitlist) {
                        return res.json({ 
                            success: false, 
                            requireConfirmation: true, 
                            message: `Room ${room.number} is full. Do you want to Waitlist for this 1st choice, or auto-switch to your 2nd choice?` 
                        });
                    } else {
                        updatedItem.status = 'Waitlisted';
                    }
                } else {
                    // Changing to an available room should explicitly reset status back to Pending if it was waitlisted
                    if (updatedItem.status === 'Waitlisted') updatedItem.status = 'Pending Review';
                }
            }
            delete updatedItem.forceWaitlist;
        }

        const updates = Object.keys(updatedItem).map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const vals = [...Object.values(updatedItem), id];
        
        if (updates) {
            const { rowCount } = await pool.query(`UPDATE ${key} SET ${updates} WHERE id = $${vals.length}`, vals);
            if (rowCount > 0) {
            
                // --- FCM PUSH NOTIFICATION TRIGGER ---
                if (key === 'complaints' && updatedItem.status === 'Resolved') {
                    // Try to notify the student assuming they might have the same name as username or we just broadcast to user tracking
                    // (For robust systems, Complaint table should store the creator's username)
                     const { rows: users } = await pool.query('SELECT fcm_token FROM users WHERE username = $1 AND fcm_token IS NOT NULL', [updatedItem.student]);
                     if (users.length && users[0].fcm_token) {
                         sendPushNotification(users[0].fcm_token, 'Complaint Resolved!', `Your complaint regarding ${updatedItem.category} was resolved.`);
                     }
                }
                if (key === 'applications' && updatedItem.status === 'Approved') {
                     const { rows: users } = await pool.query('SELECT fcm_token FROM users WHERE username = $1 AND fcm_token IS NOT NULL', [updatedItem.student]);
                     if (users.length && users[0].fcm_token) {
                         sendPushNotification(users[0].fcm_token, 'Room Application Approved!', `Your application for Room ${updatedItem.roomNumber} is approved!`);
                     }
                }
            
                broadcastUpdate(key); // Notify all live dashboards
                return res.json({ success: true });
            }
        }
        res.status(404).json({ success: false, message: 'Item not found' });
    } catch (err) {
        console.error(`Error updating in ${key}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/data/:key/:id', verifyToken, async (req, res) => {
    const { key, id } = req.params;
    try {
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info'];
        if (!allowedTables.includes(key)) return res.status(400).json({ success: false, message: 'Invalid table' });

        const { rowCount } = await pool.query(`DELETE FROM ${key} WHERE id = $1`, [id]);
        
        if (rowCount > 0) {
            broadcastUpdate(key); // Notify all live dashboards
            return res.json({ success: true });
        }
        res.status(404).json({ success: false, message: 'Item not found' });
    } catch (err) {
        console.error(`Error deleting from ${key}:`, err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 HostelSphere Server running at http://localhost:${PORT}`);
        console.log(`   Payment mode: ${RAZORPAY_LIVE ? '✅ LIVE Razorpay' : '🧪 DEMO (add keys in .env to go live)'}\n`);
    });
}

module.exports = app;
