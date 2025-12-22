import React, { useState } from "react";
import { Paper, Typography, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import API from "../../api/axios";

export default function YearlySummary(){
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const res = await API.get(`/reports/summary?from=${year}-01-01&to=${year}-12-31&group=month`);
      setRows(res.data.groups || []);
    } catch (err) { console.error(err); }
  };

  return (
    <Paper sx={{ p:3 }}>
      <Typography variant="h5" sx={{ mb:2 }}>Yearly Summary</Typography>
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={3}><TextField label="Year" value={year} onChange={e=>setYear(e.target.value)} /></Grid>
        <Grid item xs={2}><Button onClick={load}>Load</Button></Grid>
      </Grid>

      <Table size="small">
        <TableHead><TableRow><TableCell>Period</TableCell><TableCell>Total Order</TableCell><TableCell>Total Dispatch</TableCell><TableCell>Consumption</TableCell><TableCell>Cost</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((r,i)=>(<TableRow key={i}><TableCell>{r.period}</TableCell><TableCell>{r.total_order}</TableCell><TableCell>{r.total_dispatch}</TableCell><TableCell>{r.consump}</TableCell><TableCell>{r.cost_estimate}</TableCell></TableRow>))}
        </TableBody>
      </Table>
    </Paper>
  );
}
