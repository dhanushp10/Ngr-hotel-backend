// src/pages/LunchReport.jsx
import React, { useState } from "react";
import { Paper, Typography, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import API from "../../api/axios";
import dayjs from "dayjs";

export default function LunchReport(){
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [branch, setBranch] = useState("");
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      // find dispatch id for date & Lunch, then call orders
      const res = await API.get(`/dispatch/date/${date}`);
      const dispatch = res.data.find(d => d.session === "Lunch");
      if (!dispatch) return alert("No Lunch dispatch found");
      if (!branch) return alert("Select a branch");
      const r2 = await API.get(`/orders/${dispatch.dispatch_id}/${branch}`);
      setRows(r2.data);
    } catch (err) { console.error(err); }
  };

  return (
    <Paper sx={{ p:3 }}>
      <Typography variant="h5" sx={{ mb:2 }}>Lunch Report</Typography>
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={3}><TextField type="date" fullWidth value={date} onChange={e=>setDate(e.target.value)} /></Grid>
        <Grid item xs={3}><TextField fullWidth label="Branch" value={branch} onChange={e=>setBranch(e.target.value)} /></Grid>
        <Grid item xs={2}><Button onClick={load}>Load</Button></Grid>
      </Grid>

      <Table size="small">
        <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Item</TableCell><TableCell>Qty</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((r,i)=>(<TableRow key={i}><TableCell>{r.code_no}</TableCell><TableCell>{r.item_name}</TableCell><TableCell>{r.qty}</TableCell></TableRow>))}
        </TableBody>
      </Table>
    </Paper>
  );
}
