const pool = require("../db");

async function createDatabase() {
  try {
    console.log("Creating database hotel_dispatch3...\n");

    // Create database
    await pool.query("CREATE DATABASE IF NOT EXISTS hotel_dispatch3");
    console.log("✓ Database created");

    // Use the database
    await pool.query("USE hotel_dispatch3");

    // Drop tables for clean start
    console.log("Cleaning up existing tables...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("DROP TABLE IF EXISTS inventory_daily");
    await pool.query("DROP TABLE IF EXISTS sale_reports");
    await pool.query("DROP TABLE IF EXISTS daily_stats");
    await pool.query("DROP TABLE IF EXISTS branch_orders");
    await pool.query("DROP TABLE IF EXISTS dispatches");
    await pool.query("DROP TABLE IF EXISTS dishes");
    await pool.query("DROP TABLE IF EXISTS users");
    await pool.query("DROP TABLE IF EXISTS branches");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 1. Create branches table
    console.log("\nCreating tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        branch_id INT AUTO_INCREMENT PRIMARY KEY,
        branch_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ branches table created");

    // 2. Create dishes table (VARCHAR code_no to support 1a, 2a, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dishes (
        code_no VARCHAR(50) PRIMARY KEY,
        item_name VARCHAR(100) NOT NULL,
        rate DECIMAL(10,2) DEFAULT 0.00,
        INDEX idx_item_name (item_name)
      )
    `);
    console.log("✓ dishes table created (VARCHAR code_no)");

    // 3. Create dispatches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dispatches (
        dispatch_id INT AUTO_INCREMENT PRIMARY KEY,
        dispatch_date DATE NOT NULL,
        session ENUM('Lunch', 'Dinner') NOT NULL,
        status ENUM('PENDING', 'DISPATCHED') DEFAULT 'PENDING',
        dispatched_at DATETIME,
        INDEX idx_date_session (dispatch_date, session)
      )
    `);
    console.log("✓ dispatches table created");

    // 4. Create branch_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branch_orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        dispatch_id INT,
        branch_id INT,
        code_no VARCHAR(50),
        qty INT DEFAULT 0,
        status ENUM('RECEIVED', 'DISPATCHED') DEFAULT 'RECEIVED',
        dispatched_at DATETIME,
        FOREIGN KEY (dispatch_id) REFERENCES dispatches(dispatch_id),
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
        FOREIGN KEY (code_no) REFERENCES dishes(code_no),
        INDEX idx_dispatch_branch (dispatch_id, branch_id)
      )
    `);
    console.log("✓ branch_orders table created");

    // 5. Create daily_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        date DATE NOT NULL,
        code_no VARCHAR(50) NOT NULL,
        kg FLOAT DEFAULT 0,
        plates FLOAT DEFAULT 0,
        PRIMARY KEY (date, code_no),
        FOREIGN KEY (code_no) REFERENCES dishes(code_no)
      )
    `);
    console.log("✓ daily_stats table created");

    // 6. Create sale_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dispatch_id INT,
        branch_id INT,
        code_no VARCHAR(50),
        ob VARCHAR(50),
        received FLOAT,
        total FLOAT,
        con FLOAT,
        others VARCHAR(100),
        com VARCHAR(100),
        total2 FLOAT,
        cb VARCHAR(50),
        s_exes FLOAT,
        remarks VARCHAR(255),
        report VARCHAR(100),
        FOREIGN KEY (dispatch_id) REFERENCES dispatches(dispatch_id),
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
        FOREIGN KEY (code_no) REFERENCES dishes(code_no),
        INDEX idx_dispatch_branch (dispatch_id, branch_id)
      )
    `);
    console.log("✓ sale_reports table created");

    // 7. Create inventory_daily table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_daily (
        date DATE NOT NULL,
        code_no VARCHAR(50) NOT NULL,
        received FLOAT DEFAULT 0,
        wastage FLOAT DEFAULT 0,
        closing FLOAT DEFAULT 0,
        consumption FLOAT DEFAULT 0,
        PRIMARY KEY (date, code_no),
        FOREIGN KEY (code_no) REFERENCES dishes(code_no)
      )
    `);
    console.log("✓ inventory_daily table created");

    // 8. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        role ENUM('hotel', 'kitchen', 'admin') NOT NULL DEFAULT 'hotel',
        branch_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ users table created");

    console.log("\n✅ All tables created successfully!");
    process.exit(0);

  } catch (err) {
    console.error("Error creating database:", err);
    process.exit(1);
  }
}

createDatabase();
