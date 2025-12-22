const pool = require("../db");

async function migrate() {
    try {
        console.log("Starting migration V2...");

        // Drop FK
        console.log("Dropping FK...");
        try {
            await pool.query("ALTER TABLE branch_orders DROP FOREIGN KEY branch_orders_ibfk_3");
        } catch (e) {
            console.log("FK drop failed (maybe already dropped?):", e.message);
        }

        // Modify branch_orders
        console.log("Modifying branch_orders...");
        await pool.query("ALTER TABLE branch_orders MODIFY COLUMN code_no VARCHAR(50) NOT NULL");

        // Modify dishes
        console.log("Modifying dishes...");
        await pool.query("ALTER TABLE dishes MODIFY COLUMN code_no VARCHAR(50) NOT NULL");

        // Restore FK (Optional, good for integrity)
        console.log("Restoring FK...");
        // Check if index exists first? Usually modifying keeps index.
        await pool.query("ALTER TABLE branch_orders ADD CONSTRAINT branch_orders_ibfk_3 FOREIGN KEY (code_no) REFERENCES dishes(code_no)");

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

migrate();
