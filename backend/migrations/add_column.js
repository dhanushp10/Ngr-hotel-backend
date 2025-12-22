const pool = require("../db");

async function alterTable() {
    try {
        // Check if column exists first or just try to add it (catch error if exists)
        // Simpler to just try adding
        await pool.query("ALTER TABLE daily_stats ADD COLUMN plates FLOAT DEFAULT 0");
        console.log("Column 'plates' added to 'daily_stats'.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'plates' already exists.");
            process.exit(0);
        }
        console.error("Error altering table:", err);
        process.exit(1);
    }
}

alterTable();
