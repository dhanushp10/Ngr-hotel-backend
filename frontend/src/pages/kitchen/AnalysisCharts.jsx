import React, { useState, useEffect } from "react";
import {
    Typography,
    Grid,
    TextField,
    Box,
    Card,
    CardContent,
    Autocomplete
} from "@mui/material";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line
} from 'recharts';
import API from "../../api/axios";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

export default function AnalysisCharts({ data, pieData, barData, type, value, startDate, endDate }) {

    // Trend Analysis State (Moved from Parent)
    const [trendItem, setTrendItem] = useState(null);
    const [trendData, setTrendData] = useState([]);

    // Initialize Trend Item when data loads
    useEffect(() => {
        if (!trendItem && data.length > 0) {
            setTrendItem(data[0]);
        }
    }, [data, trendItem]);

    // Load Trend Data when item changes
    useEffect(() => {
        if (!trendItem) return;

        // Determine date range for trend
        let from = startDate;
        let to = endDate;
        if (type === 'date') {
            from = value;
            to = value; // Daily trend might just be one point or intraday? 
            // Actually, for "date" type in backend, it usually returns that day's data. 
            // If the user selects "date", trend analysis for a SINGLE day is boring (1 point). 
            // Maybe we should auto-expand to a month?
            // But let's keep original logic for now strictly.
            // Original logic:
            /*
            if (type === 'date') {
                from = value;
                to = value;
            }
            */
            // Ideally trend should show history relative to that date? 
            // For now I will reproduce EXACT original behavior.
        } else if (type === 'month') {
            const date = new Date(value + "-01");
            from = value + "-01";
            to = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10);
        } else if (type === 'year') {
            from = value + "-01-01";
            to = value + "-12-31";
        }

        API.get("/kitchen/product-report", {
            params: {
                item_code: trendItem.code_no,
                from,
                to
            }
        })
            .then(res => setTrendData(res.data))
            .catch(console.error);

    }, [trendItem, type, value, startDate, endDate]);

    return (
        <Grid container spacing={3}>
            {/* ROW 1: Pie & Bar */}
            <Grid item xs={12} md={5}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Top 5 Items (By Sales Value)</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        isAnimationActive={false} // Performance Fix
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={7}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Lunch vs Dinner (Top 10 Volume)</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Lunch" stackId="a" fill="#8884d8" isAnimationActive={false} />
                                    <Bar dataKey="Dinner" stackId="a" fill="#82ca9d" isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* ROW 2: Trend Analysis */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Item Trend Analysis (Closing Balance)</Typography>
                            <Autocomplete
                                options={data}
                                getOptionLabel={(option) => option.item_name || ""}
                                value={trendItem}
                                onChange={(event, newValue) => setTrendItem(newValue)}
                                sx={{ width: 300 }}
                                renderInput={(params) => <TextField {...params} label="Select Item to Analyze" size="small" />}
                                disableListWrap // Optimization
                            />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {type === 'date' ? "Select a 'Range' or 'Month' view to see trends over time." : `Showing trends for ${trendItem?.item_name || '...'}`}
                        </Typography>

                        <Box sx={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dispatch_date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cb"
                                        stroke="#8884d8"
                                        name="Closing Balance"
                                        activeDot={{ r: 8 }}
                                        isAnimationActive={false}
                                        dot={false} // Optimization for many points
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="dispatch_qty"
                                        stroke="#82ca9d"
                                        name="Dispatch Qty"
                                        isAnimationActive={false}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
