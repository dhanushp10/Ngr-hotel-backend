const pool = require("../db");

async function migrate() {
    try {
        console.log("Starting migration...");

        // Disable FK checks
        await pool.query("SET FOREIGN_KEY_CHECKS=0");

        // Modify branch_orders
        console.log("Modifying branch_orders...");
        await pool.query("ALTER TABLE branch_orders MODIFY COLUMN code_no VARCHAR(50) NOT NULL");

        // Modify dishes
        console.log("Modifying dishes...");
        await pool.query("ALTER TABLE dishes MODIFY COLUMN code_no VARCHAR(50) NOT NULL");

        // Re-enable FK checks
        await pool.query("SET FOREIGN_KEY_CHECKS=1");

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

migrate();
