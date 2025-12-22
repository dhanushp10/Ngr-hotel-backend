import React, { useState } from "react";
import API from "../../api/axios";
import {
  Paper, Typography, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";

export default function DateRangeSummary() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rows, setRows] = useState([]);

  const loadData = () => {
    if (!start || !end) {
      alert("Select both dates");
      return;
    }
    console.log("Loading range", start, end);
API.get(`/summary/range?start=${start}&end=${end}`)
  .then(res => {
     console.log("Response:", res.data);
     setRows(res.data);
  })
  .catch(err => console.error("Error:", err));


   
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Date Range Summary
      </Typography>

      {/* Date Inputs */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <Button variant="contained" onClick={loadData}>
          Load Summary
        </Button>
      </div>

      {/* Summary Table */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>B1</TableCell>
            <TableCell>B2</TableCell>
            <TableCell>B3</TableCell>
            <TableCell>B4</TableCell>
            <TableCell>B5</TableCell>
            <TableCell>B6</TableCell>
            <TableCell>B7</TableCell>
            <TableCell>Total Qty</TableCell>
            <TableCell>Total Value</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.code_no}>
              <TableCell>{r.code_no}</TableCell>
              <TableCell>{r.item_name}</TableCell>
              <TableCell>{r.rate}</TableCell>
              <TableCell>{r.B1}</TableCell>
              <TableCell>{r.B2}</TableCell>
              <TableCell>{r.B3}</TableCell>
              <TableCell>{r.B4}</TableCell>
              <TableCell>{r.B5}</TableCell>
              <TableCell>{r.B6}</TableCell>
              <TableCell>{r.B7}</TableCell>
              <TableCell>{r.total_qty}</TableCell>
              <TableCell>{r.total_value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
