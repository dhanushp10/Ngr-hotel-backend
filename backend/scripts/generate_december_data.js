const pool = require("../db");

// Utilities
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

async function generateData() {
    const connection = await pool.getConnection();
    try {
        console.log("Starting Data Generation (Nov - Dec)...");
        await connection.beginTransaction();

        // 1. Get Metadata (Branches, Dishes)
        const [branches] = await connection.query("SELECT branch_id, branch_name FROM branches");
        const [dishes] = await connection.query("SELECT code_no, item_name, rate FROM dishes");
        // Get Raw Items for stock register (codes ending in 'a' or just all from kitchen_raw_items if exists)
        // Based on previous conv, kitchen_raw_items exists.
        const [rawItems] = await connection.query("SELECT code FROM kitchen_raw_items");

        if (branches.length === 0 || dishes.length === 0) {
            throw new Error("No branches or dishes found. Populating metadata first?");
        }

        console.log(`Found ${branches.length} branches, ${dishes.length} dishes, ${rawItems.length} raw items.`);

        // 2. Loop Nov 1 - Dec 31
        const startDate = new Date("2025-11-01");
        const endDate = new Date("2025-12-31");

        console.log("Cleaning up existing Nov-Dec 2025 data...");
        // Cleanup based on date range
        await connection.query("DELETE FROM daily_stats WHERE date BETWEEN ? AND ?", ["2025-11-01", "2025-12-31"]);
        await connection.query("DELETE FROM kitchen_raw_stock_daily WHERE date BETWEEN ? AND ?", ["2025-11-01", "2025-12-31"]);

        // Complex delete for orders/sales via dispatch
        // Find dispatch IDs to delete
        const [dispatchesToDelete] = await connection.query("SELECT dispatch_id FROM dispatches WHERE dispatch_date BETWEEN ? AND ?", ["2025-11-01", "2025-12-31"]);
        if (dispatchesToDelete.length > 0) {
            const ids = dispatchesToDelete.map(d => d.dispatch_id).join(',');
            await connection.query(`DELETE FROM branch_orders WHERE dispatch_id IN (${ids})`);
            await connection.query(`DELETE FROM sale_reports WHERE dispatch_id IN (${ids})`);
            await connection.query(`DELETE FROM dispatches WHERE dispatch_id IN (${ids})`);
        }
        console.log("Cleanup complete.");

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            console.log(`Processing ${dateStr}...`);

            // Track total plates per dish for the DAY (across both sessions)
            const dailyPlateTotals = {}; // { code_no: total_qty }

            // Sessions: Lunch, Dinner
            for (const session of ['Lunch', 'Dinner']) {
                // A. Create Dispatch
                const [dispRes] = await connection.query(
                    `INSERT INTO dispatches (dispatch_date, session, status, dispatched_at) 
                     VALUES (?, ?, 'DISPATCHED', NOW())`,
                    [dateStr, session]
                );
                const dispatchId = dispRes.insertId;

                // B. Generate Orders per Branch
                for (const branch of branches) {
                    // Iterate ALL dishes
                    for (const dish of dishes) {
                        // High probability (e.g., 80%) to include the item to ensure "all items" coverage globally across branches
                        // Or maybe lower per branch, but high overall? 
                        // User said "include all the items", implies broad menu usage.
                        // Let's say 40% chance per dish per branch per session. 
                        // With 7 branches * 2 sessions = 14 opportunities for a dish to be ordered per day.
                        // 0.4 * 14 = ~5.6 times per day. That's good coverage.

                        if (Math.random() > 0.6) { // 40% chance
                            const qty = getRandomInt(10, 50); // Avg ~30

                            // Add to Daily Total
                            if (!dailyPlateTotals[dish.code_no]) dailyPlateTotals[dish.code_no] = 0;
                            dailyPlateTotals[dish.code_no] += qty;

                            // Insert Order
                            await connection.query(
                                `INSERT INTO branch_orders (dispatch_id, branch_id, code_no, qty, status, dispatched_at)
                                 VALUES (?, ?, ?, ?, 'DISPATCHED', NOW())`,
                                [dispatchId, branch.branch_id, dish.code_no, qty]
                            );

                            // C. Generate Sale Report (Simulating sale ~ dispatch)
                            // Assume 90% sold, 10% closing/wastage/others
                            const received = qty;
                            const sold = Math.floor(received * 0.9);
                            const closing = received - sold;

                            await connection.query(
                                `INSERT INTO sale_reports 
                                (dispatch_id, branch_id, code_no, ob, received, total, con, others, com, total2, cb, s_exes, remarks, report)
                                 VALUES (?, ?, ?, '-', ?, ?, ?, 0, 0, ?, ?, 0, 'Auto-gen', 'Sent')`,
                                [dispatchId, branch.branch_id, dish.code_no, received, received, sold, sold, closing]
                            );
                        }
                    }
                }
            }

            // D. DAILY STATS (Chicken Conversion)
            // Rule: plates must equal total dispatched (dailyPlateTotals)
            for (const [codeNo, totalPlates] of Object.entries(dailyPlateTotals)) {
                // Calculate KG roughly (e.g. 4 plates per KG)
                const kg = parseFloat((totalPlates / 4).toFixed(2));

                await connection.query(
                    `INSERT INTO daily_stats (date, code_no, kg, plates)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE kg=VALUES(kg), plates=VALUES(plates)`,
                    [dateStr, codeNo, kg, totalPlates]
                );
            }

            // E. STOCK REGISTER (Simulate usage for Raw Items)
            // Simplified: Generate random logical stock flow
            for (const item of rawItems) {
                // Random OB (Opening Balance)
                const ob = getRandomFloat(5, 20);
                const received = getRandomFloat(10, 50);
                const wastage = getRandomFloat(0, 2);
                const consumption = getRandomFloat(10, 40); // Should be <= ob + received - wastage

                // Ensure consumption isn't too high
                const maxCons = ob + received - wastage;
                const finalCons = Math.min(consumption, maxCons);

                const closing = parseFloat((ob + received - wastage - finalCons).toFixed(2));

                await connection.query(
                    `INSERT INTO kitchen_raw_stock_daily 
                     (date, item_code, received, wastage, consumption, closing)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE received=VALUES(received)`, // Simple upsert
                    [dateStr, item.code, received, wastage, finalCons, closing]
                );
            }
        }

        await connection.commit();
        console.log("✅ Nov-Dec Data Generation Complete!");
        process.exit(0);

    } catch (err) {
        await connection.rollback();
        console.error("❌ Error generating data:", err);
        process.exit(1);
    } finally {
        connection.release();
    }
}

generateData();
