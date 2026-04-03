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

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// ─── PostgreSQL Pool ─────────────────────────────────────────────────────────
let pool = null;
try {
    if (process.env.SUPABASE_URL) {
        pool = new Pool({
            connectionString: process.env.SUPABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        pool.query('SELECT 1').then(() => console.log('✅ Connected to Database')).catch(e => console.error('❌ DB Fail', e.message));
    }
} catch (err) { console.error('❌ DB Error', err.message); }

// Table Initialization
async function initTables() {
    if(!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                student VARCHAR(255),
                title TEXT,
                message TEXT,
                date VARCHAR(255),
                read BOOLEAN DEFAULT false
            )
        `);
    } catch(e) {}
}
initTables();

// Auth Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false, message: 'Access Denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'task_jwt_secret');
        req.user = verified;
        next();
    } catch (e) { res.status(401).json({ success: false }); }
};

// ─── AUTH API ─────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
        if (rows.length > 0) {
            const user = rows[0];
            if (await bcrypt.compare(password, user.password)) {
                const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'task_jwt_secret', { expiresIn: '7d' });
                res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
                return res.json({ success: true, user: { username: user.username, role: user.role } });
            }
        }
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { rows: existing } = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'User exists' });
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)', [username, email, hashed, 'student']);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('jwt', { path: '/' });
    res.json({ success: true });
});

// Verify Session
app.get('/api/auth/verify', (req, res) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'task_jwt_secret');
        res.json({ success: true, user: verified });
    } catch (e) { res.status(401).json({ success: false }); }
});

// ─── DATA API ─────────────────────────────────────────────────────────────────
app.get('/api/data/:key', verifyToken, async (req, res) => {
    const { key } = req.params;
    try {
        const { rows } = await pool.query(`SELECT * FROM ${key}`);
        const parsed = rows.map(r => {
            if (typeof r.idProof === 'string' && r.idProof.startsWith('{')) r.idProof = JSON.parse(r.idProof);
            if (typeof r.photo === 'string' && r.photo.startsWith('{')) r.photo = JSON.parse(r.photo);
            if (typeof r.facilities === 'string' && r.facilities.startsWith('[')) r.facilities = JSON.parse(r.facilities);
            return r;
        });
        res.json(parsed);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/data/:key', verifyToken, async (req, res) => {
    const { key } = req.params;
    const item = req.body;
    try {
        if (!item.id && key !== 'users') item.id = Date.now().toString();
        if (item.idProof) item.idProof = JSON.stringify(item.idProof);
        if (item.photo) item.photo = JSON.stringify(item.photo);
        if (item.facilities) item.facilities = JSON.stringify(item.facilities);

        const cols = Object.keys(item);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`INSERT INTO ${key} ("${cols.join('", "')}") VALUES (${placeholders})`, Object.values(item));
        broadcastUpdate(key);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/data/:key/:id', verifyToken, async (req, res) => {
    const { key, id } = req.params;
    const item = req.body;
    try {
        // Deep copy to avoid mutating Original
        const updateData = { ...item };
        if (updateData.idProof) updateData.idProof = JSON.stringify(updateData.idProof);
        if (updateData.photo) updateData.photo = JSON.stringify(updateData.photo);
        if (updateData.facilities) updateData.facilities = JSON.stringify(updateData.facilities);

        const cols = Object.keys(updateData);
        const sets = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
        const vals = [...Object.values(updateData), id];
        await pool.query(`UPDATE ${key} SET ${sets} WHERE id = $${vals.length}`, vals);

        // --- Status Change Logic (Notifications & Occupancy) ---
        if (key === 'applications') {
            const status = item.status;
            if (['Approved - Awaiting Payment', 'Allocated', 'Rejected', 'Withdrawn', 'Refund Pending', 'Waitlisted'].includes(status)) {
                let title = 'Application Update';
                let message = `Your status: ${status}`;
                if (status === 'Allocated') message = `Allocated to Room ${item.roomNumber}!`;
                if (status === 'Withdrawn') message = 'Your refund and move-out processed.';
                
                await pool.query('INSERT INTO notifications (student, title, message, date) VALUES ($1, $2, $3, $4)', 
                    [item.student, title, message, new Date().toLocaleDateString()]);

                // Room Vacancy / Occupancy logic
                if (status === 'Allocated' && item.roomId) {
                    await pool.query('UPDATE rooms SET occupied = occupied + 1 WHERE id = $1', [item.roomId]);
                    broadcastUpdate('rooms');
                } else if (status === 'Withdrawn' && item.roomId) {
                    await pool.query('UPDATE rooms SET occupied = CASE WHEN occupied > 0 THEN occupied - 1 ELSE 0 END WHERE id = $1', [item.roomId]);
                    broadcastUpdate('rooms');
                }
            }
        }

        broadcastUpdate(key);
        res.json({ success: true });
    } catch (e) { 
        console.error("PUT Error:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

app.delete('/api/data/:key/:id', verifyToken, async (req, res) => {
    try {
        await pool.query(`DELETE FROM ${req.params.key} WHERE id = $1`, [req.params.id]);
        broadcastUpdate(req.params.key);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// ─── Finance API (Full Professional Suite) ───────────────────────────────────
app.get('/api/finance/summary', verifyToken, async (req, res) => {
    try {
        const { rows: payments } = await pool.query('SELECT amount, date, method FROM payments');
        const { rows: apps } = await pool.query('SELECT "status", "totalAmount", "student", "roomNumber" FROM applications');
        const { rows: expenses } = await pool.query('SELECT amount, category FROM expenses');
        
        const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        
        // Month-specific Revenue
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();
        const monthIncome = payments.filter(p => {
             const d = new Date(p.date);
             return d.getMonth() === curM && d.getFullYear() === curY;
        }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        // Revenue by last 6 months
        const getLast6MonthsRange = () => {
             const dates = [];
             for (let i = 5; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  dates.push({ month: d.getMonth(), year: d.getFullYear() });
             }
             return dates;
        };
        const revenueByMonth = getLast6MonthsRange().map(range => {
             return payments.filter(p => {
                  const d = new Date(p.date);
                  return d.getMonth() === range.month && d.getFullYear() === range.year;
             }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        });

        // Expense by Category
        const expenseByCategory = expenses.reduce((acc, e) => {
             const cat = e.category || 'Other';
             acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
             return acc;
        }, {});

        // Payment Methods
        const paymentMethods = payments.reduce((acc, p) => {
             const m = p.method || 'Online';
             acc[m] = (acc[m] || 0) + 1;
             return acc;
        }, {});

        res.json({
            success: true,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            monthIncome,
            revenueByMonth,
            expenseByCategory,
            paymentMethods,
            pendingPayments: apps.filter(a => a.status === 'Approved - Awaiting Payment'),
            moveOutRequests: apps.filter(a => a.status === 'Refund Pending'),
            paymentCount: payments.length,
            expenseCount: expenses.length,
            refundLiability: apps.filter(a => a.status === 'Refund Pending').reduce((sum, a) => sum + parseFloat(a.totalAmount || 0), 0)
        });
    } catch (e) { 
        console.error("Finance API Error:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
module.exports = app;
