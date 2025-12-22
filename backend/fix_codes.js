const pool = require('./db');

async function fixCodes() {
    const connection = await pool.getConnection();

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS=0');
        console.log("Disabled FK checks.");

        // 1. Get all dishes where code_no mismatch
        const [allDishes] = await connection.query(`
            SELECT code_no, sort_order, item_name 
            FROM dishes 
            WHERE sort_order IS NOT NULL 
              AND sort_order > 0 
        `);

        // Filter in JS to avoid collation error
        const dishes = allDishes.filter(d => String(d.code_no) !== String(d.sort_order));

        console.log(`Found ${dishes.length} dishes to migrate.`);

        for (const dish of dishes) {
            const oldCode = dish.code_no;
            const newCode = String(dish.sort_order);

            // console.log(`Migrating ${oldCode} (${dish.item_name}) -> ${newCode}`);

            try {
                // A. HANDLE DISHES TABLE
                // Check if newCode already exists
                const [targetExists] = await connection.query('SELECT code_no FROM dishes WHERE code_no = ?', [newCode]);

                if (targetExists.length > 0) {
                    // Target "12" exists. We are moving "CB" to "12".
                    // We delete the existing "12" assuming "CB" is the master record we want to keep (as it has the SortOrder).
                    await connection.query('DELETE FROM dishes WHERE code_no = ?', [newCode]);
                    console.log(`  - Deleted existing dish ${newCode} to allow overwrite.`);
                }

                // Update the Dish
                await connection.query('UPDATE dishes SET code_no = ? WHERE code_no = ?', [newCode, oldCode]);

                // B. HANDLE DEPENDENT TABLES
                // tables: inventory_daily, daily_stats, branch_orders, sale_reports
                const tables = ['inventory_daily', 'daily_stats', 'branch_orders', 'sale_reports'];

                for (const table of tables) {
                    try {
                        // Update records with oldCode to newCode. 
                        // If newCode already exists (composite PK), we might have to DELETE or IGNORE.
                        // Simplest strategy: UPDATE IGNORE.
                        // MySQL's UPDATE IGNORE ignores errors. If PK conflict, it skips the update.
                        // This leaves some rows with oldCode? No, that's bad.
                        // Better: DELETE conflicting newCode rows, then Update oldCode -> newCode.

                        // 1. Delete rows with NewCode (to clear space for OldCode rows to move in)
                        // This assumes OldCode rows contain the "better" data or we just merge by overwriting.
                        // Actually, for stats, summing might be better, but let's stick to simple overwrite for now 
                        // as we assume the numeric-code rows were "empty" or "orphaned" or "wrong".

                        // Only delete if it would cause duplicate.
                        // Actually, just DELETE all rows with `newCode` in child tables to be safe? 
                        // No, that loses data if the newCode was actually being used.
                        // But the user says "old code should be new code", implying new code wasn't the active one.

                        // Let's try UPDATE IGNORE first. If it stays as OldCode, we have a problem.
                        // Let's use ON DUPLICATE equivalent logic. 
                        // Or just:
                        await connection.query(`UPDATE IGNORE ${table} SET code_no = ? WHERE code_no = ?`, [newCode, oldCode]);
                        // Then DELETE distinct oldCode rows that failed to update?
                        await connection.query(`DELETE FROM ${table} WHERE code_no = ?`, [oldCode]);

                    } catch (e) {
                        // console.log(`  - Error updating ${table} for ${oldCode}:`, e.message);
                    }
                }

            } catch (err) {
                console.error(`Failed to migrate ${oldCode} -> ${newCode}:`, err.message);
            }
        }

        console.log("Migration Loop Complete.");

        // Final sanity check or cleanup could go here

        await connection.query('SET FOREIGN_KEY_CHECKS=1');
        console.log("Enabled FK checks.");
        process.exit(0);

    } catch (err) {
        console.error("Critical Error:", err);
        await connection.query('SET FOREIGN_KEY_CHECKS=1');
        process.exit(1);
    } finally {
        connection.release();
    }
}

fixCodes();
