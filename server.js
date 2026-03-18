require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(__dirname));

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper functions for DB
const readDB = async () => await fs.readJson(DB_PATH);
const writeDB = async (data) => await fs.writeJson(DB_PATH, data, { spaces: 2 });

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
    const db = await readDB();
    const user = db.users.find(u => u.email === email && u.password === password && u.role === role);
    if (user) {
        res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const db = await readDB();
    if (db.users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const newUser = { username, email, password, role: 'student' };
    db.users.push(newUser);
    await writeDB(db);
    res.json({ success: true, message: 'User registered successfully' });
});

// ─── DATA API ─────────────────────────────────────────────────────────────────
app.get('/api/data/:key', async (req, res) => {
    const db = await readDB();
    res.json(db[req.params.key] || []);
});

app.post('/api/data/:key', async (req, res) => {
    const { key } = req.params;
    const item = req.body;
    const db = await readDB();
    if (!db[key]) db[key] = [];
    if (!item.id) item.id = Date.now();
    db[key].push(item);
    await writeDB(db);
    res.json({ success: true, item });
});

app.put('/api/data/:key/:id', async (req, res) => {
    const { key, id } = req.params;
    const updatedItem = req.body;
    const db = await readDB();
    if (db[key]) {
        const index = db[key].findIndex(item => item.id == id);
        if (index !== -1) {
            db[key][index] = { ...db[key][index], ...updatedItem };
            await writeDB(db);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ success: false, message: 'Item not found' });
});

app.delete('/api/data/:key/:id', async (req, res) => {
    const { key, id } = req.params;
    const db = await readDB();
    if (db[key]) {
        const index = db[key].findIndex(item => item.id == id);
        if (index !== -1) {
            db[key].splice(index, 1);
            await writeDB(db);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ success: false, message: 'Item not found' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 HostelSphere Server running at http://localhost:${PORT}`);
    console.log(`   Payment mode: ${RAZORPAY_LIVE ? '✅ LIVE Razorpay' : '🧪 DEMO (add keys in .env to go live)'}\n`);
});
