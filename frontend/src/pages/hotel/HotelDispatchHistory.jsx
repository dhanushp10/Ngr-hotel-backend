import React, { useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import API from "../../api/axios";

export default function HotelDispatchHistory() {
    const [history, setHistory] = useState([]);
    const [open, setOpen] = useState(false);
    const [viewItems, setViewItems] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        API.get("/hotel/dispatches")
            .then((res) => setHistory(res.data))
            .catch((err) => console.error(err));
    };

    const viewOrder = (dispatch_id, branch_id) => {
        API.get("/kitchen/dispatch-orders/view", {
            params: { dispatch_id, branch_id },
        })
            .then((res) => {
                setViewItems(res.data);
                setOpen(true);
            })
            .catch((err) => {
                console.error("VIEW ERROR:", err);
            });
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Hotel Dispatch History
            </Typography>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Session</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell>Total Items</TableCell>
                        <TableCell>Total Qty</TableCell>
                        <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {history.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center">
                                No history found
                            </TableCell>
                        </TableRow>
                    ) : (
                        history.map((o) => (
                            <TableRow key={o.dispatch_id + o.branch_id}>
                                <TableCell>{o.dispatch_date && o.dispatch_date.slice(0, 10)}</TableCell>
                                <TableCell>{o.dispatched_time}</TableCell>
                                <TableCell>{o.session}</TableCell>
                                <TableCell>{o.branch_name}</TableCell>
                                <TableCell>{o.total_items}</TableCell>
                                <TableCell>{o.total_qty}</TableCell>
                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => viewOrder(o.dispatch_id, o.branch_id)}
                                    >
                                        View Items
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* VIEW MODAL */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Dispatch Details</DialogTitle>
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
                                    <TableCell>{r.qty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button sx={{ mt: 2 }} onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogContent>
            </Dialog>
        </Paper>
    );
}
