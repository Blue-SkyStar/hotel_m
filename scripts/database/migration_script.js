const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgresql://postgres:taskneedstohaveharderpasswordthan12345@db.hdtgfphtkvnkufuyjonh.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🚀 Starting DB Migration...');
        
        // Add new columns to applications
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS "termMonths" INTEGER DEFAULT 1');
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS "startDate" DATE DEFAULT CURRENT_DATE');
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS "endDate" DATE DEFAULT (CURRENT_DATE + INTERVAL \'1 month\')');
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC DEFAULT 0');
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS "monthlyRent" NUMERIC DEFAULT 0');
        
        console.log('✅ Migration successful: Added termMonths, startDate, endDate, totalAmount, monthlyRent to applications table.');
        
    } catch (e) {
        console.error('❌ Migration failed:', e.message);
    } finally {
        await pool.end();
    }
}

migrate();
