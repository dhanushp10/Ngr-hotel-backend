import React, { useState, useEffect } from "react";
import { Paper, Typography, Grid, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import API from "../../api/axios";

export default function ProductReport(){
  const [items, setItems] = useState([]);
  const [itemCode, setItemCode] = useState("");
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10));
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [data, setData] = useState(null);

  useEffect(()=> {
    API.get("/dishes/list-full").then(res => setItems(res.data)).catch(() => setItems([]));
  }, []);

  const load = () => {
    if (!itemCode) return alert("Choose item");
    API.get(`/product-report?item_code=${itemCode}&from=${from}&to=${to}`).then(res => setData(res.data)).catch(console.error);
  };

  return (
    <Paper sx={{ p:3 }}>
      <Typography variant="h5" sx={{ mb:2 }}>Product Report</Typography>

      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={4}>
          <TextField select fullWidth label="Item" value={itemCode} onChange={e=>setItemCode(e.target.value)}>
            {items.map(it => <MenuItem key={it.code_no} value={it.code_no}>{it.code_no} - {it.item_name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={3}><TextField type="date" fullWidth value={from} onChange={e=>setFrom(e.target.value)} /></Grid>
        <Grid item xs={3}><TextField type="date" fullWidth value={to} onChange={e=>setTo(e.target.value)} /></Grid>
        <Grid item xs={2}><Button onClick={load}>Load</Button></Grid>
      </Grid>

      {data && <>
        <Typography variant="h6">Totals</Typography>
        <pre>{JSON.stringify(data.totals, null, 2)}</pre>

        <Typography variant="h6">Branch Breakdown</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Branch</TableCell><TableCell>L-O</TableCell><TableCell>D-O</TableCell><TableCell>L-D</TableCell><TableCell>D-D</TableCell><TableCell>Cons</TableCell><TableCell>CB</TableCell></TableRow></TableHead>
          <TableBody>{data.branch_breakdown.map((b,i)=>(<TableRow key={i}><TableCell>{b.branch_name}</TableCell><TableCell>{b.order.lunch}</TableCell><TableCell>{b.order.dinner}</TableCell><TableCell>{b.dispatch.lunch}</TableCell><TableCell>{b.dispatch.dinner}</TableCell><TableCell>{b.sale.consump}</TableCell><TableCell>{b.sale.cb}</TableCell></TableRow>))}</TableBody>
        </Table>
      </>}
    </Paper>
  );
}
