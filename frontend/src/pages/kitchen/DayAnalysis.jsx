import React, { useState } from "react";
import { Paper, Typography, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import API from "../../api/axios";
import dayjs from "dayjs";

export default function DayAnalysis(){
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const res = await API.get(`/kitchen-statement?date=${date}`);
      setRows(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  return (
    <Paper sx={{ p:3 }}>
      <Typography variant="h5" sx={{ mb:2 }}>Day Analysis</Typography>

      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={3}><TextField type="date" fullWidth value={date} onChange={e=>setDate(e.target.value)} /></Grid>
        <Grid item xs={2}><Button onClick={load}>Load</Button></Grid>
      </Grid>

      <Table size="small">
        <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Item</TableCell><TableCell>Dispatch</TableCell><TableCell>Consumption</TableCell><TableCell>CB</TableCell><TableCell>Ex/Sht</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((r,i)=>(<TableRow key={i}><TableCell>{r.code_no}</TableCell><TableCell>{r.item_name}</TableCell><TableCell>{r.total_dispatch}</TableCell><TableCell>{r.consump}</TableCell><TableCell>{r.cb}</TableCell><TableCell>{r.excess_short}</TableCell></TableRow>))}
        </TableBody>
      </Table>
    </Paper>
  );
}
