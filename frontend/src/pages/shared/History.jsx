import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Paper, Typography, TextField, MenuItem, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Grid
} from "@mui/material";

export default function History() {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [branch, setBranch] = useState("");
  const [session, setSession] = useState("Lunch");
  const [rows, setRows] = useState([]);

  const loadHistory = () => {
    if (!branch) return;
    API.get(`/history?date=${date}&branch=${branch}&session=${session}`)
      .then((res) => setRows(res.data));
  };

  // Auto reload when date/session/branch changes
  useEffect(() => {
    if (branch) loadHistory();
  }, [date, branch, session]);

  const totalValue = rows.reduce((sum, r) => sum + Number(r.value || 0), 0);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        History Viewer
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        
        <Grid item xs={12} sm={3}>
          <TextField
            type="date"
            label="Date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Branch"
            fullWidth
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {[1,2,3,4,5,6,7].map((b) => (
              <MenuItem key={b} value={b}>
                Branch {b}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Session"
            fullWidth
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <MenuItem value="Lunch">Lunch</MenuItem>
            <MenuItem value="Dinner">Dinner</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            fullWidth
            sx={{ height: "100%" }}
            onClick={loadHistory}
          >
            Reload
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Save</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={r.code_no}>
              <TableCell>{r.code_no}</TableCell>
              <TableCell>{r.item_name}</TableCell>

              <TableCell>
                <TextField
                  type="number"
                  value={r.qty}
                  onChange={(e) => {
                    const updated = [...rows];
                    updated[idx].qty = e.target.value;
                    setRows(updated);
                  }}
                  sx={{ width: 80 }}
                />
              </TableCell>

              <TableCell>{r.rate}</TableCell>
              <TableCell>{Number(r.qty) * Number(r.rate)}</TableCell>

              <TableCell>
                <Button
                  variant="outlined"
                  onClick={() => {
                    API.post("/history/update", {
                      date,
                      branch_id: branch,
                      session,
                      code_no: r.code_no,
                      qty: r.qty
                    }).then(() => alert("Updated!"));
                  }}
                >
                  Save
                </Button>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Total Value: ₹{totalValue.toLocaleString("en-IN")}
      </Typography>
    </Paper>
  );
}
