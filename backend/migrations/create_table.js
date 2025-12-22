const mysql = require('mysql2/promise');
const dbConfig = require("../db").config; // Assuming db.js exports a pool or config. 
// Actually db.js usually exports the pool directly. Let's check db.js first or just try to require the pool.
// Use same standard connection as app.js

const pool = require("../db");

async function createTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS daily_stats (
        date DATE NOT NULL,
        code_no VARCHAR(50) NOT NULL,
        kg FLOAT DEFAULT 0,
        PRIMARY KEY (date, code_no)
      )
    `;
        await pool.query(query);
        console.log("Table 'daily_stats' created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
}

createTable();
