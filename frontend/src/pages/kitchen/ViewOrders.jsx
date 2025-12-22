import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Button, Table,
  TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import API from "../../api/axios";

export default function ViewOrders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = () => {
    API.get("/kitchen/view-orders")
      .then(res => setOrders(res.data))
      .catch(console.error);
  };

  const dispatchOrders = () => {
    if (!window.confirm("Confirm dispatch for today?")) return;

    API.post("/kitchen/dispatch-orders")
      .then(() => {
        alert("Orders dispatched successfully");
        setOrders([]);
      })
      .catch(err => {
        console.error(err);
        alert("Dispatch failed");
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Today’s Received Orders
      </Typography>

      <Button variant="outlined" onClick={loadOrders} sx={{ mb: 2 }}>
        View Orders
      </Button>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Branch</TableCell>
            <TableCell>Session</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Qty</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {orders.map((o, i) => (
            <TableRow key={i}>
              <TableCell>{o.branch_name}</TableCell>
              <TableCell>{o.session}</TableCell>
              <TableCell>{o.code_no}</TableCell>
              <TableCell>{o.item_name}</TableCell>
              <TableCell>{o.qty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {orders.length > 0 && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          sx={{ mt: 3 }}
          onClick={dispatchOrders}
        >
          Dispatch Orders
        </Button>
      )}
    </Paper>
  );
}
