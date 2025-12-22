import React, { useState, useEffect } from "react";
import { Paper, Typography, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import API from "../../api/axios";
import dayjs from "dayjs";

export default function Dashboard() {
  const today = dayjs().format("YYYY-MM-DD");
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState([]);

  useEffect(() => load(), []); // initial

  function load() {
    const y = dayjs(date).year();
    const m = dayjs(date).month() + 1;
    API.get(`/dashboard/${y}/${m}`).then(res => setRows(res.data)).catch(console.error);
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Dashboard (Dispatch Status)</Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <TextField type="month" value={dayjs(date).format("YYYY-MM")} onChange={e => { setDate(dayjs(e.target.value + "-01").format("YYYY-MM-DD")); }} />
        </Grid>
        <Grid item xs={2}>
          <button onClick={load} style={{ height: "100%" }}>Load</button>
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Lunch</TableCell>
            <TableCell>Dinner</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r,i) => (
            <TableRow key={i}>
              <TableCell>{dayjs(r.dispatch_date).format("YYYY-MM-DD")}</TableCell>
              <TableCell>{r.lunch ? "✔" : "-"}</TableCell>
              <TableCell>{r.dinner ? "✔" : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
