const pool = require("../db");

async function debug() {
    try {
        // 1. Check columns
        console.log("--- DESCRIBE daily_stats ---");
        const [cols] = await pool.query("DESCRIBE daily_stats");
        console.log(cols.map(c => c.Field));

        // 2. Test Query
        console.log("--- TEST QUERY ---");
        const date = '2025-01-01'; // dummy
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
      ORDER BY d.code_no LIMIT 5
    `;
        const [rows] = await pool.execute(query, [date, date]);
        console.log("Query success. Rows:", rows.length);

        process.exit(0);
    } catch (err) {
        console.error("DEBUG ERROR:", err);
        process.exit(1);
    }
}

debug();
