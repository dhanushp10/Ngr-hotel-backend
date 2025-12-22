import React, { useEffect, useState, useCallback } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,

  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import API from "../../api/axios";

export default function DispatchOrders() {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]); // New state for history
  const [open, setOpen] = useState(false);
  const [viewItems, setViewItems] = useState([]);
  const [currentDispatch, setCurrentDispatch] = useState(null); // { dispatch_id, branch_id }
  const [errors, setErrors] = useState(null);
  const [tabIndex, setTabIndex] = useState(0); // 0 = Pending, 1 = History

  /* -------------------------------------------
     LOAD PENDING ORDERS (FROM HOTEL)
  ------------------------------------------- */
  const loadOrders = useCallback(() => {
    // Load Pending
    API.get("/kitchen/dispatch-orders", { params: { date } })
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error("LOAD ORDERS ERROR:", err);
        setOrders([]);
      });

    // Load History
    API.get("/kitchen/dispatch-history", { params: { date } })
      .then((res) => setHistory(res.data))
      .catch((err) => {
        console.error("LOAD HISTORY ERROR:", err);
        setHistory([]);
      });
  }, [date]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* -------------------------------------------
     VIEW ORDER DETAILS
  ------------------------------------------- */
  /* -------------------------------------------
     VIEW / EDIT ORDER DETAILS
  ------------------------------------------- */
  const viewOrder = (dispatch_id, branch_id) => {
    // Save current dispatch/branch id for later saving
    setErrors(null);
    setCurrentDispatch({ dispatch_id, branch_id });

    API.get("/kitchen/dispatch-orders/view", {
      params: { dispatch_id, branch_id },
    })
      .then((res) => {
        // Map to editable structure
        const editableItems = res.data.map(i => ({ ...i }));
        setViewItems(editableItems);
        setOpen(true);
      })
      .catch((err) => {
        console.error("VIEW ERROR:", err);
        alert("Unable to load order");
      });
  };

  const handleQtyChange = (code_no, newQty) => {
    setViewItems(prev => prev.map(item =>
      item.code_no === code_no ? { ...item, qty: newQty } : item
    ));
  };

  /* -------------------------------------------
     DISPATCH CONFIRM
  ------------------------------------------- */
  /* -------------------------------------------
     DISPATCH CONFIRM (DIRECT or AFTER EDIT)
  ------------------------------------------- */
  const dispatchOrder = (itemsToDispatch) => {
    // itemsToDispatch: Optional array of modified items
    const { dispatch_id, branch_id } = currentDispatch || {};

    // If called from the Table List button (direct dispatch), we need arguments. 
    // But now we prefer opening the modal to check/edit first? 
    // Requirement: "whenever i view the orders...i would like to add another button to edit the content and then dispatch."
    // So let's keep the list button as "View/Dispatch" -> Opens Modal.
    // Or keep "Dispatch" button on list but maybe warn?
    // Let's assume standard flow: Click Dispatch -> Confirm. 
    // New flow: Open View -> Edit -> Click "Dispatch This" inside modal.
  };

  const confirmDispatchFromModal = () => {
    if (!window.confirm("Confirm dispatch with these quantities?")) return;

    const { dispatch_id, branch_id } = currentDispatch;
    API.post("/kitchen/dispatch/confirm", {
      dispatch_id,
      branch_id,
      items: viewItems.map(i => ({ code_no: i.code_no, qty: i.qty }))
    })
      .then(() => {
        alert("Order dispatched successfully");
        setOpen(false);
        loadOrders();
      })
      .catch((err) => {
        console.error("DISPATCH ERROR:", err);
        alert("Dispatch failed");
      });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Dispatch Orders
      </Typography>

      {/* DATE PICKER */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <TextField
            type="date"
            fullWidth
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>

        <Grid item xs={2}>
          <Button variant="contained" onClick={loadOrders}>
            Load
          </Button>
        </Grid>
      </Grid>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
          <Tab label="Pending" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {/* PENDING TABLE */}
      {tabIndex === 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Session</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No pending orders
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o, i) => (
                <TableRow key={i}>
                  <TableCell>{o.dispatch_date && o.dispatch_date.slice(0, 10)}</TableCell>
                  <TableCell>{o.session}</TableCell>
                  <TableCell>{o.branch_name}</TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => viewOrder(o.dispatch_id, o.branch_id)}
                    >
                      View / Edit / Dispatch
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* HISTORY TABLE */}
      {tabIndex === 1 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Session</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No dispatched orders
                </TableCell>
              </TableRow>
            ) : (
              history.map((o, i) => (
                <TableRow key={i}>
                  <TableCell>{o.time}</TableCell>
                  <TableCell>{o.session}</TableCell>
                  <TableCell>{o.branch_name}</TableCell>
                  <TableCell>{o.total_items}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => viewOrder(o.dispatch_id, o.branch_id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* VIEW MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viewItems.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.item_name}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={r.qty}
                      onChange={(e) => handleQtyChange(r.code_no, e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      sx={{ width: '80px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={confirmDispatchFromModal}>Confirm Dispatch</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
