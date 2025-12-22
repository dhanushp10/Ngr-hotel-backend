const pool = require("../db");

async function listItems() {
    try {
        const [rows] = await pool.query("SELECT code_no, item_name FROM dishes ORDER BY code_no");
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listItems();
