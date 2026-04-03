const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:taskneedstohaveharderpasswordthan12345@db.hdtgfphtkvnkufuyjonh.supabase.co:5432/postgres' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('complaints', 'visitors')").then(res => { console.log(JSON.stringify(res.rows, null, 2)); process.exit(0); });
