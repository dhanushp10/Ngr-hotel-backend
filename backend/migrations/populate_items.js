const pool = require("../db");

const ITEMS = [
    "CB", "CKN PCS", "LEG-PCS", "CC", "CF", "C.65", "CR", "CK", "CP", "GTR-SD",
    "C.N.SD", "C.LMN", "CKP", "CNR", "C.SIXER", "CM", "CNG", "CBLG", "CLP",
    "CCBNLS", "CW", "MB", "E.B.RICE", "MCH", "MF", "MPBL", "MRST", "MKB", "MKF",
    "MW", "NKM", "NKF", "FF", "FC", "F 65", "Fish sima", "PSK", "PRNS", "VB",
    "BSK", "GSK", "PBM", "MSK", "Egg sholay"
];

async function populate() {
    try {
        for (const item of ITEMS) {
            // Use code_no = item name for these new items
            // Check duplicate
            const [rows] = await pool.query("SELECT code_no FROM dishes WHERE code_no = ?", [item]);
            if (rows.length === 0) {
                // Insert
                await pool.query("INSERT INTO dishes (code_no, item_name, rate) VALUES (?, ?, 0)", [item, item]);
                console.log(`Inserted ${item}`);
            } else {
                console.log(`Skipped ${item} (exists)`);
            }
        }
        console.log("Population done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

populate();
