import React, { useState } from "react";
import {
  Paper, Typography, Grid, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem
} from "@mui/material";
import API from "../../api/axios";
import BranchSelector from "../../components/BranchSelector";
import dayjs from "dayjs";

export default function KitchenOrders() {
  const today = dayjs().format("YYYY-MM-DD");

  const [date, setDate] = useState(today);
  const [session, setSession] = useState("Lunch");
  const [branch, setBranch] = useState("");

  const [orders, setOrders] = useState([]);

  // Load orders from backend
  const loadOrders = () => {
    if (!branch) return alert("Select branch first");

    API.get(`/kitchen/orders/${date}/${session}/${branch}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("LOAD ORDERS ERROR:", err));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Kitchen - Order Record
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <TextField
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>

        <Grid item xs={3}>
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

        <Grid item xs={3}>
          <BranchSelector value={branch} onChange={setBranch} />
        </Grid>

        <Grid item xs={3}>
          <button onClick={loadOrders} style={{ height: "100%" }}>
            Load Orders
          </button>
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Qty</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {orders.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.code_no}</TableCell>
              <TableCell>{r.item_name}</TableCell>
              <TableCell>{r.rate}</TableCell>
              <TableCell>{r.qty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
