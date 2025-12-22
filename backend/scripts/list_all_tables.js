const pool = require("../db");

async function listTables() {
    try {
        const [tables] = await pool.query("SHOW TABLES");

        console.log("\n=== DATABASE TABLES ===\n");
        console.table(tables);

        console.log(`\nTotal tables: ${tables.length}\n`);

        // Get details for each table
        for (const tableObj of tables) {
            const tableName = Object.values(tableObj)[0];
            console.log(`\n--- ${tableName} ---`);

            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.table(columns);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

listTables();
