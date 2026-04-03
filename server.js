require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
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

// ─── PostgreSQL Pool ─────────────────────────────────────────────────────────
let pool = null;
try {
    if (process.env.SUPABASE_URL) {
        pool = new Pool({
            connectionString: process.env.SUPABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 10
        });
        // Test connection on startup
        pool.query('SELECT 1').then(() => {
            console.log('✅ PostgreSQL Pool created & connected successfully');
        }).catch(err => {
            console.error('❌ PostgreSQL test query failed:', err.message);
        });
    } else {
        console.error('❌ SUPABASE_URL not set — database features will fail');
    }
} catch (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message);
}

// Authentication Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided!' });

    try {
        const secret = process.env.JWT_SECRET || 'task_jwt_secretpasswordshouldbestrongasPi3.141592';
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid Token' });
    }
};

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
        return
        res.json({
            success: true,
            totalRevenue,
            totalExpenses,
            refundLiability,
            netProfit,
            monthIncome,
            revenueByMonth,
            occupancyTrend,
            totalCapacity,
            expenseByCategory,
            paymentMethods,
            pendingPayments: allApplications.filter(a => a.status === 'Approved - Awaiting Payment'),
            moveOutRequests: allApplications.filter(a => a.status === 'Refund Pending'),
            paymentCount: payments.length,
            expenseCount: expenses.length
        });
    } catch (err) {
        console.error('Finance API Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching finance data' });
    }
});

app.get('/api/data/:key', verifyToken, async (req, res) => {
    const { key } = req.params;
    try {
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info', 'expenses'];
        if (!allowedTables.includes(key)) {
            return res.status(400).json({ success: false, message: 'Invalid table query' });
        }
        
        const { rows } = await pool.query(`SELECT * FROM ${key}`);
        const parsedRows = rows.map(r => {
            if (r.facilities && typeof r.facilities === 'string') {
                try { r.facilities = JSON.parse(r.facilities); } catch (e) {}
            }
            if (r.idProof && typeof r.idProof === 'string' && r.idProof.startsWith('{')) {
                try { r.idProof = JSON.parse(r.idProof); } catch (e) {}
            }
            if (r.photo && typeof r.photo === 'string' && r.photo.startsWith('{')) {
                try { r.photo = JSON.parse(r.photo); } catch (e) {}
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
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info', 'expenses'];
        if (!allowedTables.includes(key)) return res.status(400).json({ success: false, message: 'Invalid table' });

        if (!item.id && key !== 'users') {
             item.id = Date.now().toString(); // Consistent ID generation
        }

        if (item.facilities && Array.isArray(item.facilities)) {
             item.facilities = JSON.stringify(item.facilities);
        }
        if (item.idProof && typeof item.idProof === 'object') {
             item.idProof = JSON.stringify(item.idProof);
        }
        if (item.photo && typeof item.photo === 'object') {
             item.photo = JSON.stringify(item.photo);
        }

        // --- ROOM APPLICATION ENGINE (Capacity, Waitlist, Duplicates) ---
        if (key === 'applications') {
            // 1. Check for existing active application for this student
            const { rows: existingApps } = await pool.query(
                'SELECT id, status FROM applications WHERE "student" = $1 AND "status" IN (\'Pending Review\', \'Approved\', \'Approved - Awaiting Payment\', \'Waitlisted\', \'Allocated\')',
                [item.student]
            );
            
            if (existingApps.length > 0) {
                const activeApp = existingApps[0];
                return res.status(409).json({ 
                    success: false, 
                    message: `You already have an active application (Status: ${activeApp.status}). Please cancel it or contact weights admin to change rooms.` 
                });
            }

            // 2. Validate Term and Calculate Dates/Amounts
            const months = parseInt(item.termMonths) || 1;
            const rent = parseFloat(item.monthlyRent) || 0;
            
            const start = new Date();
            const end = new Date();
            end.setMonth(start.getMonth() + months);
            
            item.startDate = start.toISOString().split('T')[0];
            item.endDate = end.toISOString().split('T')[0];
            item.totalAmount = months * rent;

            // 3. Check Room Capacity
            const { rows: roomRows } = await pool.query('SELECT capacity, occupied, number FROM rooms WHERE id = $1', [item.roomId]);
            if (roomRows.length > 0) {
                const room = roomRows[0];
                if (room.occupied >= room.capacity) {
                    if (!item.forceWaitlist) {
                        return res.json({ 
                            success: false, 
                            requireConfirmation: true, 
                            message: `Room ${room.number} is completely full! Do you want to Waitlist for this room?` 
                        });
                    } else {
                        item.status = 'Waitlisted';
                    }
                }
            }
            delete item.forceWaitlist;
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
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info', 'expenses'];
        if (!allowedTables.includes(key)) return res.status(400).json({ success: false, message: 'Invalid table' });

        if (updatedItem.facilities && Array.isArray(updatedItem.facilities)) {
             updatedItem.facilities = JSON.stringify(updatedItem.facilities);
        }
        if (updatedItem.idProof && typeof updatedItem.idProof === 'object') {
             updatedItem.idProof = JSON.stringify(updatedItem.idProof);
        }
        if (updatedItem.photo && typeof updatedItem.photo === 'object') {
             updatedItem.photo = JSON.stringify(updatedItem.photo);
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
                // --- IN-APP NOTIFICATIONS & FCM PUSH NOTIFICATIONS ---
                if (key === 'applications' && (updatedItem.status === 'Approved' || updatedItem.status === 'Allocated' || updatedItem.status === 'Rejected')) {
                     const statusMsg = updatedItem.status === 'Allocated' 
                        ? `Congratulations! You have been allocated to Room ${updatedItem.roomNumber}.` 
                        : (updatedItem.status === 'Approved' ? 'Your application has been approved! Please proceed with payment.' : 'Your application has been rejected.');
                     
                     // 1. Insert into persistent notifications table for in-app viewing
                     await pool.query(
                        'INSERT INTO notifications (student, title, message, type, date, read) VALUES ($1, $2, $3, $4, $5, $6)',
                        [updatedItem.student, 'Application Update', statusMsg, 'info', new Date().toLocaleDateString(), false]
                     );

                     // 2. Trigger FCM Push Notification
                     const { rows: users } = await pool.query('SELECT fcm_token FROM users WHERE username = $1 AND fcm_token IS NOT NULL', [updatedItem.student]);
                     if (users.length && users[0].fcm_token) {
                         sendPushNotification(users[0].fcm_token, 'Application Update', statusMsg);
                     }

                     // 3. Increment room occupancy if allocated
                     if (updatedItem.status === 'Allocated') {
                         await pool.query('UPDATE rooms SET occupied = occupied + 1 WHERE id = $1', [updatedItem.roomId]);
                         broadcastUpdate('rooms');
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
        const allowedTables = ['users', 'students', 'rooms', 'applications', 'payments', 'visitors', 'complaints', 'notices', 'facilities_info', 'expenses'];
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
