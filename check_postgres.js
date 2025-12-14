import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ragquery_db',
    port: process.env.DB_PORT || 5432,
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL Database');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0].now);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
