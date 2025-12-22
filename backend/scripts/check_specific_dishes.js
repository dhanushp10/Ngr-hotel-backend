// Check specific dishes to see their sort_order vs code_no
const pool = require("../db");

async function checkSpecificDishes() {
    try {
        const codes = ['93', '53', '9', 'FC', '84', '501', '502', '503', '504', '506', '507', '510', '130', '30', '27'];

        console.log("\n=== CHECKING SPECIFIC DISHES ===\n");

        for (const code of codes) {
            const [rows] = await pool.query(
                "SELECT code_no, item_name, sort_order FROM dishes WHERE code_no = ? OR sort_order = ?",
                [code, code]
            );

            if (rows.length > 0) {
                console.log(`Code: ${code}`);
                console.table(rows);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSpecificDishes();
