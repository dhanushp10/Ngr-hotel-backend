const pool = require("../db");

async function migrate() {
    try {
        console.log("Creating inventory_daily table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_daily (
        date DATE NOT NULL,
        code_no VARCHAR(50) NOT NULL,
        received FLOAT DEFAULT 0,
        wastage FLOAT DEFAULT 0,
        closing FLOAT DEFAULT 0,
        PRIMARY KEY (date, code_no),
        FOREIGN KEY (code_no) REFERENCES dishes(code_no) ON DELETE CASCADE
      )
    `);
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
