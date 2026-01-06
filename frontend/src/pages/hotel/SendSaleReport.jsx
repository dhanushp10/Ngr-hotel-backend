import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Grid, TextField, MenuItem, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Box
} from "@mui/material";
import API from "../../api/axios";
import ExcelUploader from "../../components/ExcelUploader";

export default function SendSaleReport() {

  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState("");
  const [session, setSession] = useState("Lunch");
  const [date, setDate] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

  // ---------------------------------------------------
  // LOAD BRANCHES + DISHES
  // ---------------------------------------------------
  useEffect(() => {

    // Load branches (id + name)
    API.get("/branches").then((res) => setBranches(res.data));

    // Load dishes
    API.get("/dishes/list-full").then((res) => {
      const formatted = res.data.map((d) => ({
        code_no: d.code_no,
        item_name: d.item_name,

        ob: "-",
        received: "",
        total: 0,

        con: "",
        others: "",
        com: "",
        total2: 0,

        cb: 0,
        s_exes: "",
        remarks: "",
        report: ""
      }));

      setRows(formatted);
    });

  }, []);

  // ---------------------------------------------------
  // AUTO-FILL RECEIVED QTY
  // ---------------------------------------------------
  // ---------------------------------------------------
  // OPTIMIZED AUTO-FILL: Received + OB
  // ---------------------------------------------------
  useEffect(() => {
    if (!branch || !date || !session || rows.length === 0) return;

    setLoading(true);

    Promise.all([
      API.get("/hotel/received-items", { params: { branch_id: branch, date, session } }),
      API.get("/hotel/opening-balance", { params: { branch_id: branch, date, session } })
    ])
      .then(([resReceieved, resOB]) => {
        // 1. Map Received
        const receivedMap = {};
        resReceieved.data.forEach(item => {
          receivedMap[String(item.code_no)] = Number(item.qty);
        });

        // 2. Map OB
        const obMap = {};
        resOB.data.forEach(item => {
          obMap[String(item.code_no)] = Number(item.ob);
        });

        // 3. Update Rows ONCE
        setRows(prevRows => prevRows.map(row => {
          const code = String(row.code_no);

          // Get values or keeping existing default
          const qty = receivedMap[code] || 0;
          const fetchedOB = obMap[code];

          // OB Logic: if undefined, keep current (which might be "-" or user edit). 
          // But here we are reloading context, so maybe we SHOULD update if found?
          // The previous logic only updated if found.
          const currentOB = row.ob; // "row.ob" might be "-"
          const finalOB = fetchedOB !== undefined ? fetchedOB : currentOB;

          // Received Logic: Only fill if > 0
          // If strictly 0 from DB, do we override? Previous code: qty > 0 ? qty : ""
          // Let's stick to previous behavior.
          const finalReceived = qty > 0 ? qty : "";

          // CALCULATIONS
          // Treat "-" as 0
          const numOB = finalOB === "-" ? 0 : Number(finalOB);
          const numRec = Number(finalReceived || 0);
          const total = round2(numOB + numRec);

          const con = Number(row.con || 0);
          const others = Number(row.others || 0);
          const com = Number(row.com || 0);
          const total2 = round2(con + others + com);

          const cb = round2(total - total2);

          return {
            ...row,
            ob: finalOB, // OB is usually fixed/string from db or "-"
            received: finalReceived,
            total,
            cb
          };
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [branch, date, session]); // Dependencies: only when these change (rows excluded to avoid loops, though ideally safe)


  // ---------------------------------------------------
  // UPDATE ROW VALUES
  // ---------------------------------------------------
  const updateRow = (index, field, value) => {
    let copy = [...rows];
    copy[index][field] = value;

    // Left TOTAL
    const received = Number(copy[index].received || 0);
    copy[index].total = round2((Number(copy[index].ob) || 0) + received);

    // Right total2
    const con = Number(copy[index].con || 0);
    const others = Number(copy[index].others || 0);
    const com = Number(copy[index].com || 0);
    copy[index].total2 = round2(con + others + com);

    // Closing balance
    copy[index].cb = round2(copy[index].total - copy[index].total2);


    setRows(copy);
  };

  const handleExcelUpload = (uploadedData) => {
    const newRows = rows.map(row => {
      // 1. Find the matching row in Excel data
      // Strategy: Look for a row where code columns match the current code_no (case-insensitive)
      const targetCode = String(row.code_no).trim().toLowerCase();

      const match = uploadedData.find(excelRow => {
        // Check commonly used Code headers
        // We normalize Excel keys to lower case for check
        const excelKeys = Object.keys(excelRow);

        // Find key that looks like "code"
        const codeKey = excelKeys.find(k => ["code", "code no", "codeno"].includes(k.toLowerCase().trim()));

        if (!codeKey) return false;

        const excelValue = String(excelRow[codeKey]).trim().toLowerCase();
        return excelValue === targetCode;
      });

      if (!match) return row;

      // 2. Helper to get value case-insensitively
      // keyList: array of lower-case keys we expect (e.g. ['received', 'rcv'])
      const getValue = (keyList) => {
        const excelKeys = Object.keys(match);
        // Find which key in Excel matches one of our candidates
        const foundKey = excelKeys.find(k => keyList.includes(k.toLowerCase().trim()));

        if (foundKey && match[foundKey] !== undefined) {
          return Number(match[foundKey]);
        }
        return undefined;
      };

      // Helper for string fields
      const getString = (keyList) => {
        const excelKeys = Object.keys(match);
        const foundKey = excelKeys.find(k => keyList.includes(k.toLowerCase().trim()));
        if (foundKey && match[foundKey] !== undefined) {
          return String(match[foundKey]);
        }
        return undefined;
      };

      // 3. Extract Values
      const received = getValue(["received", "rcv"]) ?? row.received;
      const con = getValue(["con", "consumption"]) ?? row.con;
      const others = getValue(["others", "other"]) ?? row.others;
      const com = getValue(["com", "company", "complimentary"]) ?? row.com;
      const s_exes = getValue(["s&exes", "s_exes", "short/excess", "short", "excess"]) ?? row.s_exes;

      const remarks = getString(["remarks", "remark"]) || row.remarks;
      const report = getString(["report"]) || row.report;

      // 4. Recalculate
      const ob = row.ob; // keep existing OB logic
      const numOB = ob === "-" ? 0 : Number(ob);

      // New values or existing
      const numRec = Number(received || 0);
      const total = round2(numOB + numRec);

      const numCon = Number(con || 0);
      const numOthers = Number(others || 0);
      const numCom = Number(com || 0);
      const total2 = round2(numCon + numOthers + numCom);

      const cb = round2(total - total2);

      return {
        ...row,
        received: received !== undefined ? round2(received) : row.received,
        con: con !== undefined ? round2(con) : row.con,
        others: others !== undefined ? round2(others) : row.others,
        com: com !== undefined ? round2(com) : row.com,
        s_exes: s_exes !== undefined ? round2(s_exes) : row.s_exes,
        remarks: remarks !== undefined ? remarks : row.remarks,
        report: report !== undefined ? report : row.report,
        total,
        total2,
        cb
      };
    });

    setRows(newRows);
    alert("Data updated from Excel");
  };

  // ---------------------------------------------------
  // SUBMIT DATA
  // ---------------------------------------------------
  const submitReport = () => {
    if (!branch) return alert("Select a branch");
    if (!date) return alert("Select a date");

    API.post("/sale-report/send", {
      branch_id: branch,
      session,
      date,
      items: rows
    })
      .then(() => alert("Sale Report Submitted"))
      .catch((err) => {
        console.error("Submit failed:", err);
        alert("Error submitting report");
      });
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Send Sale Report (Hotel)
      </Typography>

      {/* FORM GRID */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* BRANCH */}
        <Grid item xs={4}>
          <TextField
            select
            fullWidth
            label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* SESSION */}
        <Grid item xs={4}>
          <TextField
            select
            fullWidth
            label="Session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <MenuItem value="Lunch">Lunch</MenuItem>
            <MenuItem value="Dinner">Dinner</MenuItem>
          </TextField>
        </Grid>

        {/* DATE */}
        <Grid item xs={4}>
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

      </Grid>



      <Grid container sx={{ mb: 2, alignItems: 'center' }}>
        <Grid item>
          <ExcelUploader onDataLoaded={handleExcelUpload} label="Upload Report Data" />
        </Grid>
        {loading && (
          <Grid item sx={{ ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Loading data...</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* TABLE */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>OB</TableCell>
            <TableCell>Received</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>CON</TableCell>
            <TableCell>Others</TableCell>
            <TableCell>COM</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>CB</TableCell>
            <TableCell>S&EXES</TableCell>
            <TableCell>Remarks</TableCell>
            <TableCell>Report</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.code_no}>

              <TableCell>{row.item_name}</TableCell>

              <TableCell>{row.ob}</TableCell>

              {/* RECEIVED */}
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.received}
                  onChange={(e) =>
                    updateRow(index, "received", e.target.value)
                  }
                />
              </TableCell>

              {/* TOTAL */}
              <TableCell>{row.total}</TableCell>

              {/* CON */}
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.con}
                  onChange={(e) =>
                    updateRow(index, "con", e.target.value)
                  }
                />
              </TableCell>

              {/* OTHERS */}
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.others}
                  onChange={(e) =>
                    updateRow(index, "others", e.target.value)
                  }
                />
              </TableCell>

              {/* COM */}
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.com}
                  onChange={(e) =>
                    updateRow(index, "com", e.target.value)
                  }
                />
              </TableCell>

              {/* TOTAL2 */}
              <TableCell>{row.total2}</TableCell>

              {/* CB */}
              <TableCell>{row.cb <= 0 ? "-" : row.cb}</TableCell>

              {/* S&EXES */}
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.s_exes}
                  onChange={(e) =>
                    updateRow(index, "s_exes", e.target.value)
                  }
                />
              </TableCell>

              {/* REMARKS */}
              <TableCell>
                <TextField
                  size="small"
                  value={row.remarks}
                  onChange={(e) =>
                    updateRow(index, "remarks", e.target.value)
                  }
                />
              </TableCell>

              {/* REPORT */}
              <TableCell>
                <TextField
                  size="small"
                  value={row.report}
                  onChange={(e) =>
                    updateRow(index, "report", e.target.value)
                  }
                />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* SUBMIT */}
      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 3 }}
        onClick={submitReport}
      >
        Submit Sale Report
      </Button>

    </Paper >
  );
}
