const pool = require("../db");

async function migrate() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log("1. Creating 'kitchen_raw_items' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS kitchen_raw_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL
            )
        `);

        console.log("2. Creating 'kitchen_raw_stock_daily' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS kitchen_raw_stock_daily (
                date DATE NOT NULL,
                item_code VARCHAR(50) NOT NULL,
                received FLOAT DEFAULT 0,
                wastage FLOAT DEFAULT 0,
                consumption FLOAT DEFAULT 0,
                closing FLOAT DEFAULT 0,
                PRIMARY KEY (date, item_code),
                FOREIGN KEY (item_code) REFERENCES kitchen_raw_items(code) ON DELETE CASCADE
            )
        `);

        console.log("3. Migrating items from 'dishes' (1a-14a)...");
        // Select existing stock items (regex '^[0-9]+a$')
        const [existingItems] = await connection.query(
            "SELECT code_no, item_name FROM dishes WHERE code_no REGEXP '^[0-9]+a$'"
        );

        for (const item of existingItems) {
            await connection.query(
                "INSERT IGNORE INTO kitchen_raw_items (code, name) VALUES (?, ?)",
                [item.code_no, item.item_name]
            );
        }

        console.log("4. Migrating data from 'inventory_daily'...");
        // Migrate only for these codes
        const [existingData] = await connection.query(`
            SELECT date, code_no, received, wastage, consumption, closing 
            FROM inventory_daily 
            WHERE code_no REGEXP '^[0-9]+a$'
        `);

        for (const row of existingData) {
            await connection.query(`
                INSERT IGNORE INTO kitchen_raw_stock_daily 
                (date, item_code, received, wastage, consumption, closing)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [row.date, row.code_no, row.received, row.wastage, row.consumption, row.closing]);
        }

        await connection.commit();
        console.log("Migration successful!");
        process.exit(0);

    } catch (err) {
        await connection.rollback();
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        connection.release();
    }
}

migrate();
