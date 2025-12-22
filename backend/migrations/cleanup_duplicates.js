const pool = require("../db");

async function cleanup() {
    try {
        console.log("Starting cleanup...");
        await pool.query("SET FOREIGN_KEY_CHECKS=0");

        // 1. Get all dishes
        const [rows] = await pool.query("SELECT * FROM dishes");

        // 2. Identify duplicates (Name based)
        // We want to keep the one where code_no == item_name (The new string one)
        // And remove the one where code_no is numeric (The old one)

        // Map: name -> { old: code, new: code, oldRate: rate }
        const groups = {};
        for (const r of rows) {
            const name = r.item_name.trim();
            if (!groups[name]) groups[name] = {};

            const isStringCode = (r.code_no === name); // Our new convention
            if (isStringCode) {
                groups[name].new = r.code_no;
            } else {
                // Assume non-matching code is "old"
                groups[name].old = r.code_no;
                groups[name].oldRate = r.rate;
            }
        }

        let diffCount = 0;

        for (const name in groups) {
            const g = groups[name];
            if (g.new && g.old) {
                // FOUND DUPLICATE PAIR
                console.log(`Merging '${name}': Old(${g.old}) -> New(${g.new})`);

                // A. Migrate Branch Orders
                await pool.query("UPDATE branch_orders SET code_no = ? WHERE code_no = ?", [g.new, g.old]);

                // B. Update Rate on New
                if (g.oldRate > 0) {
                    await pool.query("UPDATE dishes SET rate = ? WHERE code_no = ?", [g.oldRate, g.new]);
                }

                // C. Delete Old Dish
                await pool.query("DELETE FROM dishes WHERE code_no = ?", [g.old]);

                diffCount++;
            }
        }

        await pool.query("SET FOREIGN_KEY_CHECKS=1");
        console.log(`Cleanup complete. Merged ${diffCount} items.`);
        process.exit(0);

    } catch (err) {
        console.error("CLEANUP ERROR:", err);
        process.exit(1);
    }
}

cleanup();
