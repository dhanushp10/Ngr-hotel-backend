const pool = require('./db');

async function listDishes() {
    try {
        const [rows] = await pool.query('SELECT code_no, item_name, rate FROM dishes ORDER BY code_no');
        console.log("Current Database Config:", pool.pool.config.connectionConfig.database);
        console.log("\n--- DISHES LIST ---");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listDishes();
