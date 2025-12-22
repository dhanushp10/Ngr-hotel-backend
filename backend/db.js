// db.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "pass123",          // <<< put your MySQL password here
  database: "hotel_dispatch1"
});

module.exports = pool;
