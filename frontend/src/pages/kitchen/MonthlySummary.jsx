import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  Paper, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, MenuItem, Grid
} from "@mui/material";

export default function MonthlySummary() {
  const [rows, setRows] = useState([]);
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7);

  // Load data every time month or year changes
  useEffect(() => {
    API.get(`/summary/month/${year}/${month}`).then(res => setRows(res.data));
  }, [month, year]);

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Paper sx={{ p: 3 }}>
      
      {/* TITLE */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Monthly Summary — {monthNames[month]} {year}
      </Typography>

      {/* FILTERS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <MenuItem key={m} value={m}>{monthNames[m]}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2023, 2024, 2025].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Grid>

      </Grid>

      {/* TABLE */}
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
