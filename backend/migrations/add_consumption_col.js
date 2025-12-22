const pool = require("../db");

async function addConsumption() {
    try {
        console.log("Adding consumption column...");
        await pool.query("ALTER TABLE inventory_daily ADD COLUMN consumption FLOAT DEFAULT 0");
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column exists.");
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
}

addConsumption();
