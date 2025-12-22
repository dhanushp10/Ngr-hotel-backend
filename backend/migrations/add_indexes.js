const pool = require("../db");

async function addIndexes() {
    try {
        console.log("Adding indexes...");

        // Index for dispatches date sorting
        try {
            await pool.query("CREATE INDEX idx_dispatch_date_session ON dispatches(dispatch_date, session)");
            console.log("Added index on dispatches(dispatch_date, session)");
        } catch (e) {
            console.log("Index on dispatches might already exist or error:", e.message);
        }

        // Index for sale_reports lookups
        try {
            await pool.query("CREATE INDEX idx_sr_lookup ON sale_reports(branch_id, dispatch_id)");
            console.log("Added index on sale_reports(branch_id, dispatch_id)");
        } catch (e) {
            console.log("Index on sale_reports might already exist or error:", e.message);
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Critical error:", err);
        process.exit(1);
    }
}

addIndexes();
