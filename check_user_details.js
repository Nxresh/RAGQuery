const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='user_details'", (err, rows) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        if (rows.length > 0) {
            console.log("✅ Table 'user_details' found.");
            db.all("PRAGMA table_info(user_details)", (err, cols) => {
                console.log("Columns:", cols.map(c => c.name).join(', '));
            });
        } else {
            console.log("❌ Table 'user_details' NOT found.");
        }
    });
});
