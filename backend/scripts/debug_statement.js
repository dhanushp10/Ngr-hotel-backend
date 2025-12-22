const pool = require("../db");

async function debug() {
    try {
        console.log("--- SCHEMAS ---");
        console.log("DISHES:");
        const [dCols] = await pool.query("DESCRIBE dishes");
        console.log(dCols.map(c => `${c.Field} ${c.Type}`).join('\n'));

        console.log("\nDAILY_STATS:");
        const [dsCols] = await pool.query("DESCRIBE daily_stats");
        console.log(dsCols.map(c => `${c.Field} ${c.Type}`).join('\n'));

        console.log("\nBRANCH_ORDERS:");
        const [boCols] = await pool.query("DESCRIBE branch_orders");
        console.log(boCols.map(c => `${c.Field} ${c.Type}`).join('\n'));

        console.log("\n--- TEST QUERY ---");
        const date = new Date().toISOString().slice(0, 10);
        const query = `
      SELECT 
        d.code_no,
        d.item_name,
        COALESCE(ds.kg, 0) AS kg,
        CASE WHEN COALESCE(ds.plates, 0) > 0 THEN ds.plates ELSE COALESCE(ord.plate, 0) END AS plate
      FROM dishes d
      LEFT JOIN (
        SELECT bo.code_no, SUM(bo.qty) as plate
        FROM branch_orders bo
        JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
        WHERE dp.dispatch_date = ?
        GROUP BY bo.code_no
      ) ord ON d.code_no = ord.code_no
      LEFT JOIN daily_stats ds ON d.code_no = ds.code_no AND ds.date = ?
      ORDER BY d.code_no
      LIMIT 5
    `;

        const [rows] = await pool.execute(query, [date, date]);
        console.log(`\nQuery Success! Returned ${rows.length} rows.`);
        console.log("First row sample:", rows[0]);

        process.exit(0);
    } catch (err) {
        console.error("\nDEBUG FAIL:", err.message);
        process.exit(1);
    }
}

debug();
