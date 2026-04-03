/**
 * create_expenses_table.js
 * One-time script to create the expenses table in Supabase.
 * Run: node scripts/create_expenses_table.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🔗 Connected to Supabase...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                date TEXT,
                type TEXT,
                amount NUMERIC,
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✅ expenses table created (or already exists)');

        // Verify
        const { rows } = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'expenses'
            ORDER BY ordinal_position;
        `);
        console.log('\nTable schema:');
        rows.forEach(r => console.log(`  ${r.column_name.padEnd(15)} ${r.data_type}`));

        console.log('\n🎉 Done! Expense tracking is now fully operational.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
