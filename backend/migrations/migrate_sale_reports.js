const pool = require("../db");

async function migrate() {
    try {
        console.log("Migrating sale_reports code_no to VARCHAR...");
        await pool.query("ALTER TABLE sale_reports MODIFY COLUMN code_no VARCHAR(50)");
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
