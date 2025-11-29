import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('database.sqlite');

db.all('SELECT id, title, type, created_at, substr(content, 1, 50) as content_preview FROM documents ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('--- Last 5 Documents ---');
    console.table(rows);
});
