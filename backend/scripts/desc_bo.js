const pool = require("../db");

async function desc() {
    try {
        const [cols] = await pool.query("DESCRIBE branch_orders");
        console.log(cols);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

desc();
