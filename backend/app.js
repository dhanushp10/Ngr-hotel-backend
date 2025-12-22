// ======================================================
// IMPORTS & CONFIG
// ======================================================
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ------------------------------------------------------
// UTILITY: CREATE OR GET DISPATCH ID
// ------------------------------------------------------
async function getOrCreateDispatch(date, session) {
  let [rows] = await pool.query(
    "SELECT dispatch_id FROM dispatches WHERE dispatch_date = ? AND session = ?",
    [date, session]
  );

  if (rows.length > 0) return rows[0].dispatch_id;

  let result = await pool.query(
    "INSERT INTO dispatches (dispatch_date, session) VALUES (?, ?)",
    [date, session]
  );
  return result[0].insertId;
}

// ======================================================
// BASIC TEST
// ======================================================
app.get("/api/ping", (req, res) => {
  res.send("Backend Active");
});

// ======================================================
// BRANCH LIST
// ======================================================
app.get("/api/branches", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT branch_id AS id, branch_name AS name FROM branches ORDER BY branch_id"
    );
    res.json(rows);
  } catch (err) {
    console.error("Branch fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// DISPATCH ROUTES
// ======================================================
app.get("/api/dispatch/date/:date", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM dispatches WHERE dispatch_date = ? ORDER BY session",
      [req.params.date]
    );
    res.json(rows);
  } catch (err) {
    console.error("Dispatch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// DASHBOARD (Lunch / Dinner status)
// ======================================================
app.get("/api/dashboard/:year/:month", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dispatch_date,
              MAX(CASE WHEN session='Lunch' THEN 1 ELSE 0 END) AS lunch,
              MAX(CASE WHEN session='Dinner' THEN 1 ELSE 0 END) AS dinner
       FROM dispatches
       WHERE YEAR(dispatch_date)=? AND MONTH(dispatch_date)=?
       GROUP BY dispatch_date
       ORDER BY dispatch_date`,
      [req.params.year, req.params.month]
    );
    res.json(rows);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// DISH LISTS
// ======================================================
app.get("/api/dishes/list-full", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT code_no, item_name, rate FROM dishes ORDER BY code_no"
  );
  res.json(rows);
});
// ======================================================
// SIMPLE DISH LIST (Used by QuickEntry auto-fill)
// ======================================================
app.get("/api/dishes/list", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT code_no, item_name FROM dishes ORDER BY code_no"
    );
    res.json(rows);
  } catch (err) {
    console.error("Dish simple list error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// HOTEL: QUICK BATCH ORDER ENTRY
// ======================================================
app.post("/api/orders/quick-batch", async (req, res) => {
  const { branch_id, items, session } = req.body;
  const date = new Date().toISOString().slice(0, 10);

  try {
    const dispatch_id = await getOrCreateDispatch(date, session);

    for (const item of items) {
      let [exists] = await pool.query(
        "SELECT qty FROM branch_orders WHERE dispatch_id=? AND branch_id=? AND code_no=?",
        [dispatch_id, branch_id, item.code_no]
      );

      if (exists.length > 0) {
        await pool.query(
          "UPDATE branch_orders SET qty = qty + ? WHERE dispatch_id=? AND branch_id=? AND code_no=?",
          [item.qty, dispatch_id, branch_id, item.code_no]
        );
      } else {
        await pool.query(
          "INSERT INTO branch_orders (dispatch_id, branch_id, code_no, qty) VALUES (?, ?, ?, ?)",
          [dispatch_id, branch_id, item.code_no, item.qty]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Quick batch entry error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/sale-report/send", async (req, res) => {
  const { branch_id, session, date, items } = req.body;

  try {
    const dispatch_id = await getOrCreateDispatch(date, session);

    for (const row of items) {
      await pool.query(
        `INSERT INTO sale_reports 
    (dispatch_id, branch_id, code_no, ob, received, total, con, others, com, total2, cb, s_exes, remarks, report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dispatch_id,                 // 1
          branch_id,                   // 2
          row.code_no,                 // 3
          row.ob ?? "-",               // 4
          Number(row.received || 0),   // 5
          Number(row.total || 0),      // 6
          Number(row.con || 0),        // 7
          Number(row.others || 0),     // 8
          Number(row.com || 0),        // 9
          Number(row.total2 || 0),     // 10
          Number(row.cb || 0),         // 11
          Number(row.s_exes || 0),     // 12
          row.remarks || "",           // 13
          row.report || ""             // 14  ← THIS WAS MISSING EARLIER
        ]
      );
    }


    res.json({ success: true });

  } catch (err) {
    console.error("Sale report send error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// KITCHEN: RECEIVE SALE REPORT
// ======================================================
app.post("/api/kitchen/sale-report/receive", async (req, res) => {
  const { branch_id, session, date, items } = req.body;

  try {
    const dispatch_id = await getOrCreateDispatch(date, session);

    for (const i of items) {
      await pool.query(
        `REPLACE INTO sale_reports 
        (dispatch_id, branch_id, code_no, ob, received, con, others, com, cb, s_exes, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dispatch_id, branch_id, i.code_no,
          i.ob, i.received, i.con, i.others, i.com,
          i.cb, i.s_exes, i.remarks
        ]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Sale report receive error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// KITCHEN STATEMENT (daily full summary)
// ======================================================
app.get("/api/kitchen-statement", async (req, res) => {
  const { date } = req.query;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        d.code_no,
        d.item_name,
        COALESCE(ds.kg, 0) AS kg,
        -- Prioritize manual plate entry if exists (and >0), otherwise use dispatch count
        CASE WHEN COALESCE(ds.plates, 0) > 0 THEN ds.plates ELSE COALESCE(ord.plate, 0) END AS plate,
        COALESCE(ord.HNR, 0) AS HNR,
        COALESCE(ord.CHIMNY, 0) AS CHIMNY,
        COALESCE(ord.INR, 0) AS INR,
        COALESCE(ord.KRM, 0) AS KRM,
        COALESCE(ord.BGR, 0) AS BGR,
        COALESCE(ord.MRH, 0) AS MRH,
        COALESCE(ord.NWF, 0) AS NWF,
        COALESCE(ord.NAKK, 0) AS NAKK

      FROM dishes d
      
      -- 1. ORDERS Subquery (Dispatched Qty per Branch)
      LEFT JOIN (
        SELECT bo.code_no, 
               SUM(bo.qty) as plate,
               SUM(CASE WHEN b.branch_name='HNR' THEN bo.qty ELSE 0 END) AS HNR,
               SUM(CASE WHEN b.branch_name='CHIMNY' THEN bo.qty ELSE 0 END) AS CHIMNY,
               SUM(CASE WHEN b.branch_name='INR' THEN bo.qty ELSE 0 END) AS INR,
               SUM(CASE WHEN b.branch_name='KRM' THEN bo.qty ELSE 0 END) AS KRM,
               SUM(CASE WHEN b.branch_name='BGR' THEN bo.qty ELSE 0 END) AS BGR,
               SUM(CASE WHEN b.branch_name='MRH' THEN bo.qty ELSE 0 END) AS MRH,
               SUM(CASE WHEN b.branch_name='NWF' THEN bo.qty ELSE 0 END) AS NWF,
               SUM(CASE WHEN b.branch_name='NAKK' THEN bo.qty ELSE 0 END) AS NAKK
        FROM branch_orders bo
        JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
        JOIN branches b ON bo.branch_id = b.branch_id
        WHERE dp.dispatch_date = ?
        GROUP BY bo.code_no
      ) ord ON d.code_no = ord.code_no

      -- 2. DAILY STATS Subquery (KG)
      LEFT JOIN daily_stats ds ON d.code_no = ds.code_no AND ds.date = ?

      ORDER BY d.code_no
      `,
      [date, date]
    );

    res.json({ items: rows });

  } catch (err) {
    console.error("Kitchen statement error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});


// ======================================================
// DAY ANALYSIS
// ======================================================
app.get("/api/kitchen/day-analysis", async (req, res) => {
  const { date } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT d.code_no, d.item_name,
              SUM(sr.con) AS consump,
              SUM(sr.cb) AS cb,
              SUM(sr.s_exes) AS excess_short
       FROM dishes d
       LEFT JOIN sale_reports sr ON d.code_no = sr.code_no
       LEFT JOIN dispatches dp ON sr.dispatch_id = dp.dispatch_id
       WHERE dp.dispatch_date=?
       GROUP BY d.code_no, d.item_name`,
      [date]
    );

    res.json(rows);

  } catch (err) {
    console.error("Day analysis error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// UNIFIED KITCHEN REPORT (LUNCH / DINNER / TOTAL)
// ======================================================
app.get("/api/kitchen/reports/unified", async (req, res) => {
  const { type, value, startDate, endDate, branch_id } = req.query; // type: 'date'|'range'|'month'|'year', branch_id: 'all' or integer

  try {
    let whereClause = "";
    let params = [];

    if (type === "date") {
      whereClause = "dp.dispatch_date = ?";
      params = [value];
    } else if (type === "range") {
      // value will be json string or we expect startDate/endDate in query?
      // Let's use startDate/endDate query params for cleaner API
      const { startDate, endDate } = req.query;
      whereClause = "dp.dispatch_date BETWEEN ? AND ?";
      params = [startDate, endDate];
    } else if (type === "month") {
      whereClause = "DATE_FORMAT(dp.dispatch_date, '%Y-%m') = ?";
      params = [value];
    } else if (type === "year") {
      whereClause = "YEAR(dp.dispatch_date) = ?";
      params = [value];
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Branch Filter Logic
    if (branch_id && branch_id !== 'all') {
      whereClause += " AND bo.branch_id = ?";
      params.push(branch_id);
    }

    const [rows] = await pool.query(
      `SELECT d.code_no, d.item_name, d.rate,
              SUM(CASE WHEN dp.session='Lunch' THEN bo.qty ELSE 0 END) AS lunch_qty,
              SUM(CASE WHEN dp.session='Lunch' THEN bo.qty * d.rate ELSE 0 END) AS lunch_val,
              SUM(CASE WHEN dp.session='Dinner' THEN bo.qty ELSE 0 END) AS dinner_qty,
              SUM(CASE WHEN dp.session='Dinner' THEN bo.qty * d.rate ELSE 0 END) AS dinner_val,
              SUM(bo.qty) AS total_qty,
              SUM(bo.qty * d.rate) AS total_val
       FROM dishes d
       JOIN branch_orders bo ON d.code_no = bo.code_no
       JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
       WHERE ${whereClause}
         AND bo.status = 'DISPATCHED'
       GROUP BY d.code_no, d.item_name, d.rate
       ORDER BY d.code_no`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("Unified report error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// PRODUCT REPORT
// ======================================================
app.get("/api/kitchen/product-report", async (req, res) => {
  const { item_code, from, to } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT dp.dispatch_date, dp.session,
              bo.branch_id, bo.qty AS dispatch_qty,
              sr.con AS sale_con, sr.cb AS cb
       FROM branch_orders bo
       LEFT JOIN sale_reports sr ON bo.code_no = sr.code_no
       LEFT JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
       WHERE bo.code_no = ?
       AND dp.dispatch_date BETWEEN ? AND ?
       ORDER BY dp.dispatch_date`,
      [item_code, from, to]
    );

    res.json(rows);

  } catch (err) {
    console.error("Product report error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});
// ======================================================
// ITEM LOOKUP BY CODE (Auto-fill in hotel quick entry)
// ======================================================
app.get("/api/dishes/code/:code_no", async (req, res) => {
  const { code_no } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT code_no, item_name, rate FROM dishes WHERE code_no = ?",
      [code_no]
    );

    if (rows.length === 0) return res.json(null);

    res.json(rows[0]);

  } catch (err) {
    console.error("Dish lookup error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});
app.get("/api/items/lookup/:code", async (req, res) => {
  const code = req.params.code;

  try {
    const [rows] = await pool.query(
      "SELECT code_no, item_name FROM dishes WHERE code_no = ?",
      [code]
    );

    res.json(rows.length ? rows[0] : null);

  } catch (err) {
    console.error("Item lookup error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});
// ======================================================
// GET SALE REPORT (if already entered)
// ======================================================
app.get("/api/sale-report/get", async (req, res) => {
  const { branch_id, date, session } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT sr.*, d.item_name
       FROM sale_reports sr
       JOIN dishes d ON sr.code_no = d.code_no
       JOIN dispatches dp ON sr.dispatch_id = dp.dispatch_id
       WHERE sr.branch_id=? AND dp.dispatch_date=? AND dp.session=?`,
      [branch_id, date, session]
    );

    res.json(rows);

  } catch (err) {
    console.error("Sale report fetch failed:", err);
    res.status(500).json({ error: "DB Error" });
  }
});
// ======================================================
// KITCHEN: LOAD ORDERS FOR DATE + SESSION + BRANCH
// ======================================================
app.get("/api/kitchen/orders/:date/:session/:branch", async (req, res) => {
  const { date, session, branch } = req.params;

  try {
    const [dispatch] = await pool.query(
      "SELECT dispatch_id FROM dispatches WHERE dispatch_date=? AND session=?",
      [date, session]
    );

    if (dispatch.length === 0)
      return res.json([]); // No dispatch yet

    const dispatch_id = dispatch[0].dispatch_id;

    const [rows] = await pool.query(
      `SELECT d.code_no, d.item_name, d.rate,
              IFNULL(bo.qty, 0) AS qty
       FROM dishes d
       LEFT JOIN branch_orders bo 
       ON d.code_no = bo.code_no
       AND bo.dispatch_id = ?
       AND bo.branch_id = ?
       ORDER BY d.code_no`,
      [dispatch_id, branch]
    );

    res.json(rows);

  } catch (err) {
    console.error("Kitchen order fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});
// ======================================================
// KITCHEN: SAVE ORDER ENTRY
// ======================================================
app.post("/api/kitchen/orders/save", async (req, res) => {
  const { date, session, branch_id, items } = req.body;

  try {
    const dispatch_id = await getOrCreateDispatch(date, session);

    await pool.query(
      "DELETE FROM branch_orders WHERE dispatch_id=? AND branch_id=?",
      [dispatch_id, branch_id]
    );

    for (const i of items) {
      if (i.qty > 0) {
        await pool.query(
          "INSERT INTO branch_orders (dispatch_id, branch_id, code_no, qty) VALUES (?, ?, ?, ?)",
          [dispatch_id, branch_id, i.code_no, i.qty]
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Kitchen order save error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.get("/api/kitchen/view-orders", async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        bo.branch_id,
        b.name AS branch_name,
        d.code_no,
        d.item_name,
        bo.qty,
        dp.session
      FROM branch_orders bo
      JOIN dishes d ON bo.code_no = d.code_no
      JOIN branches b ON bo.branch_id = b.id
      JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
      WHERE dp.dispatch_date = ?
        AND bo.status = 'RECEIVED'
      ORDER BY b.name, d.code_no
      `,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error("View orders error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/kitchen/dispatch-orders", async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);

  try {
    await pool.query(
      `
      UPDATE branch_orders bo
      JOIN dispatches dp ON bo.dispatch_id = dp.dispatch_id
      SET bo.status = 'DISPATCHED'
      WHERE dp.dispatch_date = ?
        AND bo.status = 'RECEIVED'
      `,
      [date]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Dispatch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// kitchen dispatch

// GET pending dispatch orders for date
app.get("/api/kitchen/dispatch-orders", async (req, res) => {
  const { date } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name,
              COUNT(bo.code_no) AS total_items
       FROM dispatches d
       JOIN branch_orders bo ON d.dispatch_id = bo.dispatch_id
       JOIN branches b ON bo.branch_id = b.branch_id
       WHERE d.dispatch_date = ?
       AND (bo.status IS NULL OR bo.status != 'DISPATCHED')
       GROUP BY d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name
       ORDER BY d.session, b.branch_name`,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error("Dispatch list error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// CONFIRM DISPATCH (Per Branch)
app.post("/api/kitchen/dispatch/confirm", async (req, res) => {
  const { dispatch_id, branch_id, items } = req.body;
  // items: [{ code_no, qty }] (Optionally present)

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. If items provided, update quantities
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // Need to find order_id to update efficiently, or update by keys
        // Using keys: dispatch_id, branch_id, code_no
        await connection.query(
          `UPDATE branch_orders SET qty = ? 
           WHERE dispatch_id = ? AND branch_id = ? AND code_no = ?`,
          [item.qty, dispatch_id, branch_id, item.code_no]
        );
      }
    }

    // 2. Mark as DISPATCHED
    await connection.query(
      "UPDATE branch_orders SET status='DISPATCHED', dispatched_at=NOW() WHERE dispatch_id=? AND branch_id=?",
      [dispatch_id, branch_id]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error("Dispatch confirm error:", err);
    res.status(500).json({ error: "DB Error" });
  } finally {
    connection.release();
  }
});

// GET DISPATCH HISTORY
app.get("/api/kitchen/dispatch-history", async (req, res) => {
  const { date } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name,
              COUNT(bo.code_no) AS total_items,
              DATE_FORMAT(MAX(bo.dispatched_at), '%H:%i') as time
       FROM dispatches d
       JOIN branch_orders bo ON d.dispatch_id = bo.dispatch_id
       JOIN branches b ON bo.branch_id = b.branch_id
       WHERE d.dispatch_date = ?
       AND bo.status = 'DISPATCHED'
       GROUP BY d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name
       ORDER BY MAX(bo.dispatched_at) DESC`,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error("Dispatch history error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// GET full dispatch order details (View specific branch order)
app.get("/api/kitchen/dispatch-orders/view", async (req, res) => {
  const { dispatch_id, branch_id } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT b.branch_name, bo.code_no, di.item_name, bo.qty
       FROM branch_orders bo
       JOIN branches b ON bo.branch_id = b.branch_id
       JOIN dishes di ON bo.code_no = di.code_no
       JOIN dispatches d ON bo.dispatch_id = d.dispatch_id
       WHERE bo.dispatch_id = ? AND bo.branch_id = ?
       ORDER BY b.branch_name, di.code_no`,
      [dispatch_id, branch_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Dispatch detail error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// MARK DISPATCH AS COMPLETED
app.post("/api/kitchen/dispatch-orders/:dispatch_id/dispatch", async (req, res) => {
  const { dispatch_id } = req.params;

  try {
    await pool.query(
      `UPDATE dispatches
       SET status='DISPATCHED', dispatched_at=NOW()
       WHERE dispatch_id=?`,
      [dispatch_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Dispatch update error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});


// ======================================================
// ======================================================
// DAILY STATS (KG ENTRY)
// ======================================================
app.post("/api/kitchen/daily-stats", async (req, res) => {
  const { date, items } = req.body; // items: [{ code_no, kg, plates }]

  try {
    for (const item of items) {
      await pool.query(
        `INSERT INTO daily_stats (date, code_no, kg, plates)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE kg = VALUES(kg), plates = VALUES(plates)`,
        [date, item.code_no, item.kg || 0, item.plates || 0]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Daily stats save error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.get("/api/kitchen/daily-stats", async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT code_no, kg, plates FROM daily_stats WHERE date = ?",
      [date]
    );
    res.json(rows);
  } catch (err) {
    console.error("Daily stats fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// GET HOTEL DISPATCH HISTORY
app.get("/api/hotel/dispatches", async (req, res) => {
  const { branch_id } = req.query; // If specific branch view needed later. For now fetch all or filter by ID if passed.

  // Assuming this is a general view or we can group by branch.
  // Requirement says "create a separate window for hotel..showing the record of dispatch sent"
  // Let's show all dispatches, maybe searchable by date/branch.

  try {
    const [rows] = await pool.query(
      `SELECT d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name,
              COUNT(bo.code_no) AS total_items,
              DATE_FORMAT(MAX(bo.dispatched_at), '%Y-%m-%d %H:%i') as dispatched_time,
              SUM(bo.qty) as total_qty
       FROM dispatches d
       JOIN branch_orders bo ON d.dispatch_id = bo.dispatch_id
       JOIN branches b ON bo.branch_id = b.branch_id
       WHERE bo.status = 'DISPATCHED' -- Only show sent items
       GROUP BY d.dispatch_id, d.dispatch_date, d.session, b.branch_id, b.branch_name
       ORDER BY MAX(bo.dispatched_at) DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error("Hotel history error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// GET DISPATCHED ITEMS FOR HOTEL (Auto-fill Received)
app.get("/api/hotel/received-items", async (req, res) => {
  const { branch_id, date, session } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT bo.code_no, SUM(bo.qty) as qty
       FROM branch_orders bo
       JOIN dispatches d ON bo.dispatch_id = d.dispatch_id
       WHERE bo.branch_id = ? 
         AND d.dispatch_date = ? 
         AND d.session = ?
         AND bo.status = 'DISPATCHED'
       GROUP BY bo.code_no`,
      [branch_id, date, session]
    );
    res.json(rows);
  } catch (err) {
    console.error("Received items fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// GET OPENING BALANCE SESSION-WISE
app.get("/api/hotel/opening-balance", async (req, res) => {
  const { branch_id, date, session } = req.query;

  try {
    // OPTIMIZED QUERY:
    // 1. Find the SINGLE most recent dispatch_id for this branch
    //    that is strictly before the current (date, session).

    // We strictly join with sale_reports to ensure we only pick a dispatch
    // where a report actually exists for this branch.
    const [lastDispatch] = await pool.query(
      `SELECT d.dispatch_id
       FROM dispatches d
       JOIN sale_reports sr ON d.dispatch_id = sr.dispatch_id
       WHERE sr.branch_id = ?
         AND (d.dispatch_date < ? OR (d.dispatch_date = ? AND d.session = 'Lunch' AND ? = 'Dinner'))
       ORDER BY d.dispatch_date DESC, (d.session = 'Dinner') DESC
       LIMIT 1`,
      [branch_id, date, date, session]
    );

    if (lastDispatch.length === 0) {
      return res.json([]); // No previous history found
    }

    const dispatchId = lastDispatch[0].dispatch_id;

    // 2. Fetch the Closing Balance (CB) from that specific report
    const [rows] = await pool.query(
      `SELECT code_no, cb AS ob
       FROM sale_reports
       WHERE dispatch_id = ? AND branch_id = ?`,
      [dispatchId, branch_id]
    );

    res.json(rows);

  } catch (err) {
    console.error("OB fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ======================================================
// KITCHEN: STOCK REGISTER
// ======================================================
// -------------------------------------------------------------
// KITCHEN STOCK REGISTER (SEPARATE TABLE REFACTOR)
// -------------------------------------------------------------
app.get("/api/kitchen/stock", async (req, res) => {
  const { date } = req.query;

  try {
    // 1. Get List of Raw Items (From new table)
    const [items] = await pool.query(
      "SELECT code, name as item_name FROM kitchen_raw_items ORDER BY id"
    );

    // 2. Get Previous Day's Closing Balance (as OB)
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().slice(0, 10);

    const [prevRows] = await pool.query(
      "SELECT item_code, closing FROM kitchen_raw_stock_daily WHERE date = ?",
      [prevDateStr]
    );
    const prevMap = {};
    prevRows.forEach(r => prevMap[r.item_code] = r.closing);

    // 3. Get Current Day's Data
    const [currRows] = await pool.query(
      "SELECT item_code, received, wastage, consumption, closing FROM kitchen_raw_stock_daily WHERE date = ?",
      [date]
    );
    const currMap = {};
    currRows.forEach(r => currMap[r.item_code] = r);

    // 4. Get Data for Automated Consumption Calculation
    // A. Daily Stats (Chicken/Mutton Consumption from Kitchen)
    const [statsRows] = await pool.query("SELECT code_no, kg FROM daily_stats WHERE date = ?", [date]);
    const statsMap = {};
    statsRows.forEach(r => statsMap[r.code_no] = r.kg);

    // B. Dispatches (for CBL)
    const [dispRows] = await pool.query(
      `SELECT bo.code_no, SUM(bo.qty) as dispatch_qty
       FROM branch_orders bo
       JOIN dispatches d ON bo.dispatch_id = d.dispatch_id
       WHERE d.dispatch_date = ? AND bo.status = 'DISPATCHED'
       GROUP BY bo.code_no`,
      [date]
    );
    const dispMap = {};
    dispRows.forEach(r => dispMap[r.code_no] = r.dispatch_qty);

    // MAPPING LOGIC (Remains same, mapping Item Code -> Dish Codes)
    const CON_MAPPING = {
      '1a': ['1', '2', '3', '7', '80', '57', '38', '151'], // CHICKEN 
      '2a': ['4'], // LEGES 
      '4a': ['51', '49', '213', '5', '50'], // LEG BL 
      '5a': ['215'], // LOLLYPOP 
      '6a': ['53', '8', '55', '9', '54', '93'], // MUTTON 
      '7a': ['17', '18'], // FISH 
      '8a': ['33'], // W.POMPRET 
      '9a': ['27'], // PANNER 
    };

    // 5. Merge Data
    const result = items.map(item => {
      const code = item.code;
      const ob = prevMap[code] || 0;
      const current = currMap[code] || {};

      let calcConsumption = 0;

      if (code === '3a') {
        // CBL Logic: From Dispatches (C.BONELESS = 508)
        calcConsumption = dispMap['508'] || 0;
      } else {
        // Mapping Logic
        let sources = CON_MAPPING[code];

        // Handle Singles/Specials not in array
        if (code === '10a') sources = ['114']; // PRNS
        if (code === '11a') sources = ['532']; // BABYCORN
        if (code === '12a') sources = ['31', '32']; // NKF, NKM
        if (code === '13a') sources = ['30']; // MUSHROOM MSL
        if (code === '14a') sources = ['84']; // FISH 65

        if (sources) {
          sources.forEach(srcCode => {
            calcConsumption += (statsMap[srcCode] || 0);
          });
        }
      }

      const manualConsumption = calcConsumption;

      return {
        code_no: code,       // Frontend expects 'code_no'
        item_name: item.item_name,
        ob: ob,
        received: current.received || 0,
        consumption: manualConsumption,
        wastage: current.wastage || 0,
        closing: current.closing !== undefined ? current.closing : (ob + (current.received || 0) - manualConsumption - (current.wastage || 0))
      };
    });

    res.json(result);

  } catch (err) {
    console.error("Stock fetch error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/kitchen/stock", async (req, res) => {
  const { date, items } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const item of items) {
      await connection.query(
        `INSERT INTO kitchen_raw_stock_daily (date, item_code, received, wastage, consumption, closing)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE received=?, wastage=?, consumption=?, closing=?`,
        [
          date, item.code_no, item.received, item.wastage, item.consumption, item.closing,
          item.received, item.wastage, item.consumption, item.closing
        ]
      );
    }

    await connection.commit();
    res.json({ message: "Stock saved" });

  } catch (err) {
    await connection.rollback();
    console.error("Save stock error:", err);
    res.status(500).json({ error: "Save Error" });
  } finally {
    connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
