const pool = require("./db");

async function check() {
    try {
        const [items] = await pool.query("SELECT * FROM kitchen_raw_items");
        console.log("Raw Items Count:", items.length);
        if (items.length > 0) console.log("First 3 items:", items.slice(0, 3));

        const [daily] = await pool.query("SELECT * FROM kitchen_raw_stock_daily LIMIT 5");
        console.log("Daily Stock Records found:", daily.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
