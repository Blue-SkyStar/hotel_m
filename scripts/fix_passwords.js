require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ connectionString: process.env.SUPABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        const h1 = await bcrypt.hash('12345', 10);
        const h2 = await bcrypt.hash('09876', 10);

        await client.query('UPDATE users SET password=$1 WHERE email=$2', [h1, 'admin@gmail.com']);
        await client.query('UPDATE users SET password=$1 WHERE email=$2', [h1, 'warden@gmail.com']);
        await client.query('UPDATE users SET password=$1 WHERE email=$2', [h2, 'ayan@ay.com']);

        // Also update student passwords
        const students = [
            ['priya123', 'priya@hostel.com'],
            ['rahul123', 'rahul@hostel.com'],
            ['sneha123', 'sneha@hostel.com'],
            ['arjun123', 'arjun@hostel.com'],
            ['kavya123', 'kavya@hostel.com'],
        ];
        for (const [pass, email] of students) {
            const h = await bcrypt.hash(pass, 10);
            await client.query('UPDATE users SET password=$1 WHERE email=$2', [h, email]);
        }

        console.log('✅ All passwords refreshed successfully!');
        console.log('   admin@gmail.com  / 12345');
        console.log('   warden@gmail.com / 12345');
        console.log('   ayan@ay.com      / 09876');
        console.log('   priya@hostel.com / priya123  (+ all other students)');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        process.exit(0);
    }
}
run();
