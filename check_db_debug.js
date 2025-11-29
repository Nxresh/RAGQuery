import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    console.log("Checking 'documents' table schema:");
    db.all("PRAGMA table_info(documents)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\nChecking first 5 documents:");
    db.all("SELECT id, title, user_id FROM documents LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\nChecking 'users' table for target email:");
    db.all("SELECT id, email, firebase_uid FROM users WHERE email = 'nareshryan645@gmail.com'", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });
});
