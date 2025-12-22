const pool = require("./db");

async function testApi() {
    const date = new Date().toISOString().slice(0, 10);
    console.log("Testing API logic for Date:", date);

    try {
        // 1. Get List of Raw Items
        console.log("Step 1: Fetching items...");
        const [items] = await pool.query(
            "SELECT code, name as item_name FROM kitchen_raw_items ORDER BY id"
        );
        console.log(`Found ${items.length} items.`);
        if (items.length === 0) {
            console.log("ERROR: No items found in kitchen_raw_items!");
            process.exit(0);
        }

        // 2. Get Data
        console.log("Step 2: Fetching stock data...");
        const [currRows] = await pool.query(
            "SELECT item_code, received, wastage, consumption, closing FROM kitchen_raw_stock_daily WHERE date = ?",
            [date]
        );
        console.log(`Found ${currRows.length} daily entries.`);

        // 3. Merge
        const result = items.map(item => {
            return { code: item.code, name: item.item_name };
        });

        console.log("Result Preview:", result.slice(0, 3));
        console.log("SUCCESS: API logic seems to return data.");
        process.exit(0);

    } catch (err) {
        console.error("API ERROR:", err);
        process.exit(1);
    }
}

testApi();
