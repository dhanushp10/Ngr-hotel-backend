import React, { useState, useEffect, useCallback } from "react";
import {
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import API from "../../api/axios";

export default function Reports() {
    const [type, setType] = useState("date");
    const [value, setValue] = useState(new Date().toISOString().slice(0, 10)); // For single date/month/year
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // For Range
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // For Range
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [data, setData] = useState([]);

    // Load Branches
    useEffect(() => {
        API.get("/branches").then(res => setBranches(res.data)).catch(console.error);
    }, []);

    // Load Data
    const loadReport = useCallback(() => {
        API.get("/kitchen/reports/unified", { params: { type, value, startDate, endDate, branch_id: selectedBranch } })
            .then((res) => setData(res.data))
            .catch((err) => {
                console.error("REPORT LOAD ERROR:", err);
                setData([]);
            });
    }, [type, value, startDate, endDate, selectedBranch]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    // Calculate Grand Totals
    const grandTotal = data.reduce(
        (acc, r) => ({
            l_qty: acc.l_qty + Number(r.lunch_qty),
            l_val: acc.l_val + Number(r.lunch_val),
            d_qty: acc.d_qty + Number(r.dinner_qty),
            d_val: acc.d_val + Number(r.dinner_val),
            t_qty: acc.t_qty + Number(r.total_qty),
            t_val: acc.t_val + Number(r.total_val),
        }),
        { l_qty: 0, l_val: 0, d_qty: 0, d_val: 0, t_qty: 0, t_val: 0 }
    );

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
                Sales Report
            </Typography>

            {/* FILTERS */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* BRANCH SELECTOR */}
                <Grid item xs={3}>
                    <TextField
                        select
                        fullWidth
                        label="Branch"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        <MenuItem value="all">All Hotels</MenuItem>
                        {branches.map((b) => (
                            <MenuItem key={b.id} value={b.id}>
                                {b.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item xs={3}>
                    <TextField
                        select
                        fullWidth
                        label="Report Type"
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            // Reset value format based on type
                            if (e.target.value === "date")
                                setValue(new Date().toISOString().slice(0, 10));
                            if (e.target.value === "month")
                                setValue(new Date().toISOString().slice(0, 7));
                            if (e.target.value === "year")
                                setValue(String(new Date().getFullYear()));
                        }}
                    >
                        <MenuItem value="date">Daily</MenuItem>
                        <MenuItem value="range">Date Range</MenuItem>
                        <MenuItem value="month">Monthly</MenuItem>
                        <MenuItem value="year">Yearly</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={3}>
                    {type === "date" && (
                        <TextField
                            type="date"
                            fullWidth
                            label="Select Date"
                            InputLabelProps={{ shrink: true }}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                    {type === "month" && (
                        <TextField
                            type="month"
                            fullWidth
                            label="Select Month"
                            InputLabelProps={{ shrink: true }}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                    {type === "year" && (
                        <TextField
                            type="number"
                            fullWidth
                            label="Select Year"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                </Grid>

                {/* RANGE PICKERS */}
                {type === "range" && (
                    <>
                        <Grid item xs={3}>
                            <TextField
                                type="date"
                                fullWidth
                                label="From Date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <TextField
                                type="date"
                                fullWidth
                                label="To Date"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </>
                )}


                <Grid item xs={2}>
                    <Button variant="contained" onClick={loadReport} sx={{ height: "56px" }}>
                        Refresh
                    </Button>
                </Grid>
            </Grid>

            {/* TABLE */}
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                        <TableCell rowSpan={2}>Item Name</TableCell>
                        <TableCell rowSpan={2}>Rate</TableCell>
                        <TableCell align="center" colSpan={2}>
                            Lunch
                        </TableCell>
                        <TableCell align="center" colSpan={2}>
                            Dinner
                        </TableCell>
                        <TableCell align="center" colSpan={2} sx={{ fontWeight: "bold" }}>
                            Total
                        </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Val</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Val</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            Qty
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            Val
                        </TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} align="center">
                                No data found
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, i) => (
                            <TableRow key={i}>
                                <TableCell>{row.item_name}</TableCell>
                                <TableCell>{row.rate}</TableCell>
                                <TableCell align="right">{row.lunch_qty}</TableCell>
                                <TableCell align="right">{row.lunch_val}</TableCell>
                                <TableCell align="right">{row.dinner_qty}</TableCell>
                                <TableCell align="right">{row.dinner_val}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                    {row.total_qty}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                    {row.total_val}
                                </TableCell>
                            </TableRow>
                        ))
                    )}

                    {/* GRAND TOTAL */}
                    {data.length > 0 && (
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                                Grand Total
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.l_qty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.l_val}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.d_qty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.d_val}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.t_qty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {grandTotal.t_val}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
    );
}
