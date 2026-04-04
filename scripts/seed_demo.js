require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.SUPABASE_URL, ssl: { rejectUnauthorized: false } });

async function safeInsert(client, table, keyCol, keyVal, data) {
    try {
        const exists = await client.query(`SELECT 1 FROM ${table} WHERE "${keyCol}" = $1 LIMIT 1`, [keyVal]);
        if (exists.rows.length > 0) {
            if (table === 'users') {
                const cols = Object.keys(data);
                const vals = Object.values(data);
                const sets = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                await client.query(`UPDATE ${table} SET ${sets} WHERE "${keyCol}" = $${cols.length + 1}`, [...vals, keyVal]);
            }
            return;
        }
        const cols = Object.keys(data);
        const vals = Object.values(data);
        const phs = cols.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(`INSERT INTO ${table} ("${cols.join('","')}") VALUES (${phs})`, vals);
    } catch (e) {
        console.warn(`  ⚠️  Skipped ${table}/${keyVal}: ${e.message}`);
    }
}

async function run() {
    const client = await pool.connect();
    try {
        console.log("🚀 Seeding comprehensive demo data...\n");

        const fmt = (d) => d.toLocaleDateString('en-IN');
        const today = new Date();

        // ─── ENSURE TABLES EXIST ─────────────────────────────────────────────
        const tableDefs = [
            `CREATE TABLE IF NOT EXISTS students (id TEXT, name TEXT, email TEXT, phone TEXT, course TEXT, room TEXT, gender TEXT, "guardianName" TEXT, "guardianPhone" TEXT, address TEXT, status TEXT)`,
            `CREATE TABLE IF NOT EXISTS applications (id TEXT, student TEXT, "studentName" TEXT, course TEXT, phone TEXT, guardian TEXT, "roomId" TEXT, "roomNumber" TEXT, "roomType" TEXT, "termMonths" TEXT, "monthlyRent" TEXT, "totalAmount" TEXT, "totalPrice" TEXT, facilities TEXT, status TEXT, date TEXT, "forceWaitlist" TEXT)`,
            `CREATE TABLE IF NOT EXISTS payments (id TEXT, student TEXT, room TEXT, amount TEXT, method TEXT, receipt TEXT, date TEXT, status TEXT, "applicationId" TEXT)`,
            `CREATE TABLE IF NOT EXISTS complaints (id TEXT, student TEXT, room TEXT, type TEXT, description TEXT, date TEXT, status TEXT)`,
            `CREATE TABLE IF NOT EXISTS notices (id TEXT, title TEXT, message TEXT, date TEXT, "postedBy" TEXT, category TEXT)`,
        ];
        for (const t of tableDefs) { try { await client.query(t); } catch(e){} }

        // ─── USERS & STUDENTS ────────────────────────────────────────────────
        console.log("👤 Creating accounts...");
        const accounts = [
            { username: 'admin',        email: 'admin@gmail.com',   pass: '12345',    role: 'admin'   },
            { username: 'warden',       email: 'warden@gmail.com',  pass: '12345',    role: 'warden'  },
            { username: 'ayan',         email: 'ayan@ay.com',       pass: '09876',    role: 'student' },
            { username: 'priya_patel',  email: 'priya@hostel.com',  pass: 'priya123', role: 'student' },
            { username: 'rahul_sharma', email: 'rahul@hostel.com',  pass: 'rahul123', role: 'student' },
            { username: 'sneha_reddy',  email: 'sneha@hostel.com',  pass: 'sneha123', role: 'student' },
            { username: 'arjun_nair',   email: 'arjun@hostel.com',  pass: 'arjun123', role: 'student' },
            { username: 'kavya_mehta',  email: 'kavya@hostel.com',  pass: 'kavya123', role: 'student' },
        ];
        for (const u of accounts) {
            const hashed = await bcrypt.hash(u.pass, 10);
            await safeInsert(client, 'users', 'email', u.email, { username: u.username, email: u.email, password: hashed, role: u.role });
            console.log(`  ✅ ${u.role.padEnd(7)} ${u.email} / ${u.pass}`);
        }

        // ─── STUDENT PROFILES ────────────────────────────────────────────────
        console.log("\n🎓 Creating student profiles...");
        const profiles = [
            { id: 'STU001', name: 'Priya Patel',   email: 'priya@hostel.com',  phone: '9876541230', course: 'B.Tech Computer Science', room: 'B-101', gender: 'Girls', guardianName: 'Ravi Patel',    guardianPhone: '9800001111', address: 'Surat, Gujarat',         status: 'Active' },
            { id: 'STU002', name: 'Rahul Sharma',  email: 'rahul@hostel.com',  phone: '9876542345', course: 'B.Sc Physics',            room: 'B-102', gender: 'Boys',  guardianName: 'Anil Sharma',   guardianPhone: '9800002222', address: 'Jaipur, Rajasthan',      status: 'Active' },
            { id: 'STU003', name: 'Sneha Reddy',   email: 'sneha@hostel.com',  phone: '9876543456', course: 'MBA Finance',             room: 'G-101', gender: 'Girls', guardianName: 'Lakshmi Reddy', guardianPhone: '9800003333', address: 'Hyderabad, Telangana',   status: 'Active' },
            { id: 'STU004', name: 'Arjun Nair',    email: 'arjun@hostel.com',  phone: '9876544567', course: 'B.Com',                   room: 'B-103', gender: 'Boys',  guardianName: 'Suresh Nair',   guardianPhone: '9800004444', address: 'Kochi, Kerala',          status: 'Active' },
            { id: 'STU005', name: 'Kavya Mehta',   email: 'kavya@hostel.com',  phone: '9876545678', course: 'BCA',                     room: 'G-102', gender: 'Girls', guardianName: 'Dinesh Mehta',  guardianPhone: '9800005555', address: 'Ahmedabad, Gujarat',     status: 'Active' },
            { id: 'STU006', name: 'Ayan',          email: 'ayan@ay.com',       phone: '9876546789', course: 'B.Tech',                  room: 'B-102', gender: 'Boys',  guardianName: 'Father',        guardianPhone: '9876543210', address: 'Delhi',                  status: 'Active' },
        ];
        for (const p of profiles) {
            await safeInsert(client, 'students', 'id', p.id, p);
            console.log(`  ✅ ${p.name} — ${p.course}`);
        }

        // ─── APPLICATIONS ────────────────────────────────────────────────────
        console.log("\n📋 Creating applications...");
        const apps = [
            { id: 'APP001', student: 'priya_patel',  studentName: 'Priya Patel',  course: 'B.Tech Computer Science', phone: '9876541230', guardian: 'Ravi Patel',    roomId: '16', roomNumber: 'B-101', roomType: 'Boys Single Room',   termMonths: '11', monthlyRent: '5000', totalAmount: '55000', totalPrice: '5000', facilities: 'WiFi, AC, Security', status: 'Allocated',                   date: fmt(new Date(today - 20*86400000)), forceWaitlist: 'false' },
            { id: 'APP002', student: 'rahul_sharma', studentName: 'Rahul Sharma', course: 'B.Sc Physics',            phone: '9876542345', guardian: 'Anil Sharma',   roomId: '17', roomNumber: 'B-102', roomType: 'Boys Double Room',   termMonths: '6',  monthlyRent: '4000', totalAmount: '24000', totalPrice: '4000', facilities: 'WiFi, Fan, Security', status: 'Approved - Awaiting Payment', date: fmt(new Date(today - 15*86400000)), forceWaitlist: 'false' },
            { id: 'APP003', student: 'sneha_reddy',  studentName: 'Sneha Reddy',  course: 'MBA Finance',             phone: '9876543456', guardian: 'Lakshmi Reddy', roomId: '1',  roomNumber: 'G-101', roomType: 'Girls Single Room',  termMonths: '11', monthlyRent: '5000', totalAmount: '55000', totalPrice: '5000', facilities: 'WiFi, AC, Security', status: 'Allocated',                   date: fmt(new Date(today - 25*86400000)), forceWaitlist: 'false' },
            { id: 'APP004', student: 'arjun_nair',   studentName: 'Arjun Nair',   course: 'B.Com',                   phone: '9876544567', guardian: 'Suresh Nair',   roomId: '18', roomNumber: 'B-103', roomType: 'Boys Triple Room',   termMonths: '3',  monthlyRent: '3000', totalAmount: '9000',  totalPrice: '3000', facilities: 'WiFi, Fan, Security', status: 'Rejected',                    date: fmt(new Date(today - 10*86400000)), forceWaitlist: 'false' },
            { id: 'APP005', student: 'kavya_mehta',  studentName: 'Kavya Mehta',  course: 'BCA',                     phone: '9876545678', guardian: 'Dinesh Mehta',  roomId: '2',  roomNumber: 'G-102', roomType: 'Girls Double Room',  termMonths: '6',  monthlyRent: '4000', totalAmount: '24000', totalPrice: '4000', facilities: 'WiFi, Fan, Security', status: 'Pending Review',              date: fmt(new Date(today - 2*86400000)),  forceWaitlist: 'false' },
        ];
        for (const a of apps) {
            await safeInsert(client, 'applications', 'id', a.id, a);
            console.log(`  ✅ ${a.studentName.padEnd(15)} → ${a.roomNumber} [${a.status}]`);
        }

        // ─── PAYMENTS ────────────────────────────────────────────────────────
        console.log("\n💰 Creating payments...");
        const payments = [
            { id: 'PAY001', student: 'priya_patel',  room: 'B-101', amount: '55000', method: 'Online',        receipt: 'RCP-2024-001', date: fmt(new Date(today - 18*86400000)), status: 'Paid', applicationId: 'APP001' },
            { id: 'PAY002', student: 'sneha_reddy',  room: 'G-101', amount: '55000', method: 'Cash',          receipt: 'RCP-2024-002', date: fmt(new Date(today - 23*86400000)), status: 'Paid', applicationId: 'APP003' },
            { id: 'PAY003', student: 'priya_patel',  room: 'B-101', amount: '5000',  method: 'UPI',           receipt: 'RCP-2024-003', date: fmt(new Date(today - 5*86400000)),  status: 'Paid', applicationId: 'APP001' },
            { id: 'PAY004', student: 'sneha_reddy',  room: 'G-101', amount: '5000',  method: 'Cash',          receipt: 'RCP-2024-004', date: fmt(new Date(today - 3*86400000)),  status: 'Paid', applicationId: 'APP003' },
            { id: 'PAY005', student: 'rahul_sharma', room: 'B-102', amount: '4000',  method: 'Net Banking',   receipt: 'RCP-2024-005', date: fmt(new Date(today - 1*86400000)),  status: 'Paid', applicationId: 'APP002' },
        ];
        for (const p of payments) {
            await safeInsert(client, 'payments', 'id', p.id, p);
            console.log(`  ✅ ${p.student.padEnd(15)} ₹${p.amount.padStart(6)} via ${p.method}`);
        }

        // ─── COMPLAINTS ──────────────────────────────────────────────────────
        console.log("\n📢 Creating complaints...");
        const complaints = [
            { id: 'CMP001', student: 'priya_patel',  room: 'B-101', type: 'Maintenance', description: 'AC is not cooling properly in room B-101. Temperature stays above 30°C even at full setting.',    date: fmt(new Date(today - 7*86400000)), status: 'Resolved'    },
            { id: 'CMP002', student: 'sneha_reddy',  room: 'G-101', type: 'Plumbing',    description: 'Water tap in the bathroom is leaking continuously causing water wastage.',                         date: fmt(new Date(today - 4*86400000)), status: 'In Progress' },
            { id: 'CMP003', student: 'rahul_sharma', room: 'B-102', type: 'WiFi',        description: 'Internet speed is extremely slow between 8-11 PM making it impossible to study online.',           date: fmt(new Date(today - 1*86400000)), status: 'Pending'     },
        ];
        for (const c of complaints) {
            await safeInsert(client, 'complaints', 'id', c.id, c);
            console.log(`  ✅ ${c.student.padEnd(15)} [${c.type}] — ${c.status}`);
        }

        // ─── NOTICES ─────────────────────────────────────────────────────────
        console.log("\n📌 Creating notices...");
        const notices = [
            { id: 'NTC001', title: 'Welcome to HostelSphere!',           message: 'We are pleased to launch our new digital hostel management portal. Apply for rooms, track applications, and pay fees online seamlessly.',                         date: fmt(new Date(today - 30*86400000)), postedBy: 'admin', category: 'General' },
            { id: 'NTC002', title: 'Fee Deadline – April 15, 2024',      message: 'All students must pay their hostel dues before April 15, 2024. A late fee of ₹500 per day will be charged after the deadline. Contact the warden for queries.',  date: fmt(new Date(today - 5*86400000)),  postedBy: 'admin', category: 'Finance' },
            { id: 'NTC003', title: 'Water Shutdown – April 5 (6–12 AM)', message: 'Due to scheduled maintenance, water supply will be suspended on April 5 from 6:00 AM to 12:00 PM. Please store water adequately in advance.',                   date: fmt(new Date(today - 2*86400000)),  postedBy: 'admin', category: 'Maintenance' },
        ];
        for (const n of notices) {
            await safeInsert(client, 'notices', 'id', n.id, n);
            console.log(`  ✅ "${n.title}"`);
        }

        // ─── UPDATE ROOM OCCUPANCY ────────────────────────────────────────────
        console.log("\n🏠 Updating room occupancy for allocated rooms...");
        const updates = [
            { id: '16', occ: 1 }, // B-101
            { id: '17', occ: 1 }, // B-102
            { id: '1',  occ: 1 }, // G-101
        ];
        for (const r of updates) {
            try { await client.query(`UPDATE rooms SET occupied = $1 WHERE id = $2`, [r.occ, r.id]); } catch(e) {}
        }
        console.log("  ✅ Room occupancy updated.");

        console.log("\n✨ Done! All demo data is in the database.\n");
        console.log("══════════════════════════════════════════");
        console.log("  PRESENTATION CREDENTIALS");
        console.log("══════════════════════════════════════════");
        console.log("  👑 Admin:   admin@gmail.com    / 12345");
        console.log("  🛡  Warden: warden@gmail.com  / 12345");
        console.log("  👤 Student: ayan@ay.com        / 09876   (no application)");
        console.log("  👤 Student: priya@hostel.com   / priya123 (Allocated B-101, paid)");
        console.log("  👤 Student: rahul@hostel.com   / rahul123 (Awaiting Payment B-102)");
        console.log("  👤 Student: sneha@hostel.com   / sneha123 (Allocated G-101, paid)");
        console.log("  👤 Student: arjun@hostel.com   / arjun123 (Rejected)");
        console.log("  👤 Student: kavya@hostel.com   / kavya123 (Pending Review)");
        console.log("══════════════════════════════════════════");

    } catch (e) {
        console.error("❌ Fatal Error:", e.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
