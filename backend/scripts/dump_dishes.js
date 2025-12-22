const pool = require("../db");

async function dump() {
    try {
        const [rows] = await pool.query("SELECT * FROM dishes");
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dump();
