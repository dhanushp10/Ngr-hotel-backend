import React, { useEffect, useState, useCallback } from "react";
import {
    Paper, Typography, Grid, TextField, Table,
    TableHead, TableRow, TableCell, TableBody, Button
} from "@mui/material";
import API from "../../api/axios";

export default function KitchenStock() {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [items, setItems] = useState([]);

    // Load Data
    const loadData = useCallback(() => {
        API.get("/kitchen/stock", { params: { date } })
            .then((res) => setItems(res.data))
            .catch((err) => console.error(err));
    }, [date]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle Input Change
    const handleChange = (index, field, value) => {
        const newItems = [...items];
        const item = newItems[index];

        item[field] = value === "" ? "" : Number(value);

        // Recalculate Closing Balance
        // Formula: CB = OB + Received - Dispatch - Wastage
        const ob = Number(item.ob || 0);
        const rcv = Number(item.received || 0);
        const con = Number(item.consumption || 0);
        const ww = Number(item.wastage || 0);

        item.closing = ob + rcv - con - ww;

        setItems(newItems);
    };

    // Save Data
    const saveStock = () => {
        API.post("/kitchen/stock", {
            date,
            items: items.map(i => ({
                code_no: i.code_no,
                received: Number(i.received || 0),
                consumption: Number(i.consumption || 0),
                wastage: Number(i.wastage || 0),
                closing: Number(i.closing || 0)
            }))
        })
            .then(() => alert("Stock Saved Successfully"))
            .catch((err) => {
                console.error(err);
                alert("Error saving stock");
            });
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Kitchen Stock Register
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
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
                <Grid item xs={3}>
                    <Button variant="contained" onClick={loadData} sx={{ mt: 1 }}>
                        Reload
                    </Button>
                </Grid>
            </Grid>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell sx={{ bgcolor: '#ffffcc', fontWeight: 'bold' }}>OB</TableCell>
                        <TableCell>RCV</TableCell>
                        <TableCell>Total</TableCell>

                        <TableCell>CON</TableCell>
                        <TableCell>Wastage</TableCell>
                        <TableCell sx={{ bgcolor: '#ffffcc', fontWeight: 'bold' }}>CB</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((row, index) => {
                        const ob = Number(row.ob || 0);
                        const rcv = Number(row.received || 0);
                        const inputTotal = ob + rcv;

                        return (
                            <TableRow key={row.code_no}>
                                <TableCell>{row.item_name}</TableCell>

                                {/* OB (Yellow) */}
                                <TableCell sx={{ bgcolor: '#ffffcc', fontWeight: 'bold' }}>
                                    {ob}
                                </TableCell>

                                {/* RCV (Input) */}
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.received}
                                        onChange={(e) => handleChange(index, 'received', e.target.value)}
                                        sx={{ width: '80px' }}
                                    />
                                </TableCell>

                                <TableCell>{inputTotal}</TableCell>

                                {/* Consumption (Editable) */}
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.consumption}
                                        onChange={(e) => handleChange(index, 'consumption', e.target.value)}
                                        sx={{ width: '80px' }}
                                    />
                                </TableCell>

                                {/* Wastage (Input) */}
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.wastage}
                                        onChange={(e) => handleChange(index, 'wastage', e.target.value)}
                                        sx={{ width: '80px' }}
                                    />
                                </TableCell>

                                {/* CB (Yellow) */}
                                <TableCell sx={{ bgcolor: '#ffffcc', fontWeight: 'bold' }}>
                                    {row.closing}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <Button
                variant="contained"
                color="success"
                sx={{ mt: 3 }}
                onClick={saveStock}
                fullWidth
            >
                Save Stock Register
            </Button>
        </Paper>
    );
}
