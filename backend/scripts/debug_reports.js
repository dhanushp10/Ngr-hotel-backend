const pool = require("../db");

async function debug() {
    try {
        const [cols] = await pool.query("DESCRIBE sale_reports");
        console.log("SALE_REPORTS SCHEMA:");
        console.log(cols.map(c => `${c.Field} ${c.Type}`).join('\n'));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
