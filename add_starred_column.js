import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ragquery_db',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Connected to database...');

        await client.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
    `);

        console.log('✅ Successfully added is_starred column to documents table.');
        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
