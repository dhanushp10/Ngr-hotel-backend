import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Grid, TextField, MenuItem, Button,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import API from "../../api/axios";
import ExcelUploader from "../../components/ExcelUploader";

export default function SendSaleReport() {

  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState("");
  const [session, setSession] = useState("Lunch");
  const [date, setDate] = useState("");

  const [rows, setRows] = useState([]);

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
  useEffect(() => {
    if (!branch || !date || !session || rows.length === 0) return;

    API.get("/hotel/received-items", {
      params: { branch_id: branch, date, session }
    })
      .then((res) => {
        const receivedMap = {};
        res.data.forEach(item => {
          receivedMap[String(item.code_no)] = Number(item.qty);
        });

        const newRows = rows.map(row => {
          const qty = receivedMap[String(row.code_no)] || 0;

          // Re-calculate derived values
          const received = qty;
          const total = received; // Assuming OB is - or 0 for now

          const con = Number(row.con || 0);
          const others = Number(row.others || 0);
          const com = Number(row.com || 0);
          const total2 = con + others + com;
          const cb = total - total2;

          return {
            ...row,
            received: qty > 0 ? qty : "", // Only fill if > 0
            total: total,
            cb: cb
          };
        });

        setRows(newRows);
      })
      .catch(console.error);
  }, [branch, date, session]); // Run when these change

  // ---------------------------------------------------
  // AUTO-FILL OPENING BALANCE (OB)
  // ---------------------------------------------------
  useEffect(() => {
    if (!branch || !date || !session || rows.length === 0) return;

    API.get("/hotel/opening-balance", {
      params: { branch_id: branch, date, session }
    })
      .then((res) => {
        // Map codes to OB
        const obMap = {};
        res.data.forEach(item => {
          obMap[String(item.code_no)] = Number(item.ob);
        });

        // Update Rows
        setRows(prevRows => prevRows.map(row => {
          const fetchedOB = obMap[String(row.code_no)];

          // Only update if found. If not found, default is "-" or 0.
          if (fetchedOB === undefined) return row; // Don't change if no history

          const ob = fetchedOB;
          const received = Number(row.received || 0);

          const total = ob + received;

          const con = Number(row.con || 0);
          const others = Number(row.others || 0);
          const com = Number(row.com || 0);
          const total2 = con + others + com;

          const cb = total - total2;

          return {
            ...row,
            ob: ob,
            total: total,
            cb: cb
          };
        }));
      })
      .catch(console.error);
  }, [branch, date, session]);


  // ---------------------------------------------------
  // UPDATE ROW VALUES
  // ---------------------------------------------------
  const updateRow = (index, field, value) => {
    let copy = [...rows];
    copy[index][field] = value;

    // Left TOTAL
    const received = Number(copy[index].received || 0);
    copy[index].total = received;

    // Right total2
    const con = Number(copy[index].con || 0);
    const others = Number(copy[index].others || 0);
    const com = Number(copy[index].com || 0);
    copy[index].total2 = con + others + com;

    // Closing balance
    copy[index].cb = copy[index].total - copy[index].total2;


    setRows(copy);
  };

  const handleExcelUpload = (uploadedData) => {
    // Map code_no -> row data
    const uploadMap = {};
    uploadedData.forEach(row => {
      // Allow flexible column names
      const code = row["Code"] || row["CodeNo"] || row["code_no"];
      if (code) {
        uploadMap[String(code).toLowerCase()] = row;
      }
    });

    const newRows = rows.map(row => {
      const match = uploadMap[String(row.code_no).toLowerCase()];
      if (!match) return row;

      // Extract fields if present
      const getVal = (keys) => {
        for (let k of keys) {
          if (match[k] !== undefined) return Number(match[k]);
        }
        return undefined;
      };

      const received = getVal(["RECEIVED", "received", "RCV"]) ?? row.received;
      const con = getVal(["CON", "con", "Consumption"]) ?? row.con;
      const others = getVal(["OTHERS", "others"]) ?? row.others;
      const com = getVal(["COM", "com"]) ?? row.com;
      const s_exes = getVal(["S&EXES", "s_exes", "Short/Excess"]) ?? row.s_exes;

      const remarks = match["REMARKS"] || match["remarks"] || row.remarks;
      const report = match["REPORT"] || match["report"] || row.report;

      // Recalculate totals
      const ob = Number(row.ob) || 0; // ob is string "-" or number

      // Treat "-" as 0 for calc
      const numOB = row.ob === "-" ? 0 : Number(row.ob);

      const numRec = Number(received || 0);
      const total = numOB + numRec;

      const numCon = Number(con || 0);
      const numOthers = Number(others || 0);
      const numCom = Number(com || 0);
      const total2 = numCon + numOthers + numCom;

      const cb = total - total2;

      return {
        ...row,
        received: received !== undefined ? received : row.received,
        con: con !== undefined ? con : row.con,
        others: others !== undefined ? others : row.others,
        com: com !== undefined ? com : row.com,
        s_exes: s_exes !== undefined ? s_exes : row.s_exes,
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



      <Grid container sx={{ mb: 2 }}>
        <ExcelUploader onDataLoaded={handleExcelUpload} label="Upload Report Data" />
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
