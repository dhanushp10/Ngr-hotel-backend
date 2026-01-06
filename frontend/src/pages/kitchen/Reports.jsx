import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    ToggleButton,
    ToggleButtonGroup,
    Box,
    Card,
    CardContent,
    Autocomplete
} from "@mui/material";
import API from "../../api/axios";
import * as XLSX from 'xlsx';

import AnalysisCharts from "./AnalysisCharts";

import TableViewIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';



export default function Reports() {
    // UI State
    const [viewMode, setViewMode] = useState("table"); // table | charts

    // Filter State
    const [type, setType] = useState("date");
    const [value, setValue] = useState(new Date().toISOString().slice(0, 10));
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("all");

    // Data State
    const [data, setData] = useState([]);



    // Load Branches
    useEffect(() => {
        API.get("/branches").then(res => setBranches(res.data)).catch(console.error);
    }, []);

    // Load Main Report Data
    const loadReport = useCallback(() => {
        API.get("/kitchen/reports/unified", { params: { type, value, startDate, endDate, branch_id: selectedBranch } })
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error("REPORT LOAD ERROR:", err);
                setData([]);
            });
    }, [type, value, startDate, endDate, selectedBranch]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);




    // Calculate Grand Totals
    const grandTotal = useMemo(() => data.reduce(
        (acc, r) => ({
            l_qty: acc.l_qty + Number(r.lunch_qty),
            l_val: acc.l_val + Number(r.lunch_val),
            d_qty: acc.d_qty + Number(r.dinner_qty),
            d_val: acc.d_val + Number(r.dinner_val),
            t_qty: acc.t_qty + Number(r.total_qty),
            t_val: acc.t_val + Number(r.total_val),
        }),
        { l_qty: 0, l_val: 0, d_qty: 0, d_val: 0, t_qty: 0, t_val: 0 }
    ), [data]);

    // Chart Data Preparation
    const pieData = useMemo(() => {
        return [...data]
            .sort((a, b) => Number(b.total_val) - Number(a.total_val))
            .slice(0, 5) // Top 5
            .map(item => ({ name: item.item_name, value: Number(item.total_val) }));
    }, [data]);

    const barData = useMemo(() => {
        return [...data]
            .sort((a, b) => Number(b.total_qty) - Number(a.total_qty))
            .slice(0, 10) // Top 10 by qty
            .map(item => ({
                name: item.item_name,
                Lunch: Number(item.lunch_qty),
                Dinner: Number(item.dinner_qty)
            }));
    }, [data]);


    const downloadExcel = () => {
        if (data.length === 0) return alert("No data to export");
        const excelData = data.map(r => ({
            "Code": r.code_no,
            "Item Name": r.item_name,
            "Rate": Number(r.rate),
            "Lunch Qty": Number(r.lunch_qty),
            "Lunch Val": Number(r.lunch_val),
            "Dinner Qty": Number(r.dinner_qty),
            "Dinner Val": Number(r.dinner_val),
            "Total Qty": Number(r.total_qty),
            "Total Val": Number(r.total_val)
        }));
        excelData.push({
            "Code": "TOTAL",
            "Item Name": "",
            "Rate": "",
            "Lunch Qty": grandTotal.l_qty,
            "Lunch Val": grandTotal.l_val,
            "Dinner Qty": grandTotal.d_qty,
            "Dinner Val": grandTotal.d_val,
            "Total Qty": grandTotal.t_qty,
            "Total Val": grandTotal.t_val
        });
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        XLSX.writeFile(wb, `Kitchen_Report.xlsx`);
    };

    return (
        <Paper sx={{ p: 3, minHeight: '80vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Sales Report</Typography>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => { if (newMode) setViewMode(newMode); }}
                    size="small"
                >
                    <ToggleButton value="table"><TableViewIcon sx={{ mr: 1 }} /> Table</ToggleButton>
                    <ToggleButton value="charts"><BarChartIcon sx={{ mr: 1 }} /> Charts</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* FILTERS */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={2}>
                    <TextField
                        select fullWidth label="Branch" size="small"
                        value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        <MenuItem value="all">All Hotels</MenuItem>
                        {branches.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </TextField>
                </Grid>

                <Grid item xs={2}>
                    <TextField
                        select fullWidth label="Type" size="small"
                        value={type} onChange={(e) => {
                            setType(e.target.value);
                            if (e.target.value === "date") setValue(new Date().toISOString().slice(0, 10));
                            if (e.target.value === "month") setValue(new Date().toISOString().slice(0, 7));
                            if (e.target.value === "year") setValue(String(new Date().getFullYear()));
                        }}
                    >
                        <MenuItem value="date">Daily</MenuItem>
                        <MenuItem value="range">Range</MenuItem>
                        <MenuItem value="month">Monthly</MenuItem>
                        <MenuItem value="year">Yearly</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={3}>
                    {type === "date" && <TextField type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={value} onChange={(e) => setValue(e.target.value)} />}
                    {type === "month" && <TextField type="month" fullWidth size="small" InputLabelProps={{ shrink: true }} value={value} onChange={(e) => setValue(e.target.value)} />}
                    {type === "year" && <TextField type="number" fullWidth size="small" value={value} onChange={(e) => setValue(e.target.value)} />}
                </Grid>

                {type === "range" && (
                    <>
                        <Grid item xs={2}>
                            <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Grid>
                    </>
                )}

                <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={loadReport}>Result</Button>
                    <Button variant="outlined" color="success" onClick={downloadExcel}>Export</Button>
                </Grid>
            </Grid>

            {/* CONTENT */}
            {viewMode === "table" ? (
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#eee" }}>
                            <TableCell rowSpan={2}>Item Name</TableCell>
                            <TableCell rowSpan={2}>Rate</TableCell>
                            <TableCell align="center" colSpan={2}>Lunch</TableCell>
                            <TableCell align="center" colSpan={2}>Dinner</TableCell>
                            <TableCell align="center" colSpan={2} sx={{ fontWeight: "bold" }}>Total</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: "#eee" }}>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Val</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Val</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Val</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center">No data found</TableCell></TableRow>
                        ) : (
                            data.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.item_name}</TableCell>
                                    <TableCell>{row.rate}</TableCell>
                                    <TableCell align="right">{row.lunch_qty}</TableCell>
                                    <TableCell align="right">{row.lunch_val}</TableCell>
                                    <TableCell align="right">{row.dinner_qty}</TableCell>
                                    <TableCell align="right">{row.dinner_val}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold" }}>{row.total_qty}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold" }}>{row.total_val}</TableCell>
                                </TableRow>
                            ))
                        )}
                        {data.length > 0 && (
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>Grand Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.l_qty}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.l_val}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.d_qty}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.d_val}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.t_qty}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>{grandTotal.t_val}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : <AnalysisCharts
                data={data}
                pieData={pieData}
                barData={barData}
                type={type}
                value={value}
                startDate={startDate}
                endDate={endDate}
            />
            }
        </Paper>
    );
}

