const pool = require("../db");

const MAPPING = {
    'CC': 1,
    'PRNS': 114,
    'CB': 12,
    'MB': 14,
    'CNG': 151,
    'FF': 17,
    'FC': 18,
    'CF': 2,
    'CNR': 213,
    'CLP': 215,
    'CR': 3,
    'NKF': 31,
    'NKM': 32,
    'VB': 35,
    'CM': 38,
    'C.65': 4,
    'C.SIXER': 5,
    'CCBNLS': 50,
    'CP': 51,
    'MKB': 54,
    'MPBL': 55,
    'CK': 7,
    'MF': 8,
    'GTR-SD': 80
};

async function addSortOrder() {
    try {
        console.log("Adding sort_order column...");
        try {
            await pool.query("ALTER TABLE dishes ADD COLUMN sort_order INT DEFAULT 9999");
        } catch (e) {
            console.log("Column likely exists.");
        }

        console.log("Updating sort_order for numerics...");
        // For items that are just numbers (e.g. '501'), set sort_order = 501
        await pool.query(`UPDATE dishes SET sort_order = CAST(code_no AS UNSIGNED) WHERE code_no REGEXP '^[0-9]+$'`);

        console.log("Restoring sort_order for migrated items...");
        for (const [code, order] of Object.entries(MAPPING)) {
            await pool.query("UPDATE dishes SET sort_order = ? WHERE code_no = ?", [order, code]);
        }

        // For items like 'CKN PCS' that are new and string-only, they keep default 9999 (bottom) 
        // or we can map them if we want.
        // Let's ensure 'CKN PCS' and others from the specific list used in DailyConsumption appear reasonably high?
        // Actually, "User says: from 1 2 3". This mainly refers to the legacy items. 
        // New items at bottom is fine.

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addSortOrder();
