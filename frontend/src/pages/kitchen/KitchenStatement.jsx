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
} from "@mui/material";
import API from "../../api/axios";

export default function KitchenStatement() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);

  // Branch mapping (order matters!)
  const branchColumns = [
    "HNR",
    "CHIMNY",
    "INR",
    "KRM",
    "BGR",
    "MRH",
    "NWF",
    "NAKK",
  ];

  // Load data from backend
  const loadData = useCallback(() => {
    API.get("/kitchen-statement", { params: { date } })
      .then((res) => {
        if (res.data && Array.isArray(res.data.items)) {
          setItems(res.data.items);
        } else {
          setItems([]);
        }
      })
      .catch((err) => {
        console.error("STATEMENT LOAD ERROR:", err);
        setItems([]);
      });
  }, [date]);   // <- IMPORTANT dependency!

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Kitchen Statement
      </Typography>

      {/* ------------------ DATE PICKER ------------------ */}
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

        <Grid item xs={3}>
          <Button variant="contained" onClick={loadData}>
            Load Statement
          </Button>
        </Grid>
      </Grid>

      {/* ------------------ TABLE ------------------ */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Avr.</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>KG</TableCell>
            <TableCell>Plate</TableCell>

            <TableCell>Total</TableCell>

            {/* Branch headers */}
            {branchColumns.map((b) => (
              <TableCell key={b}>{b}</TableCell>
            ))}

            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={15} style={{ textAlign: "center" }}>
                No data found
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => {
              // Plate = lunch_order + dinner_order (dispatch qty)
              const plate = Number(row.plate || 0);

              // Total = OB + Plate
              const total = plate; // OB always 0 for now

              // branch-wise consumption
              const branchData = branchColumns.map((b) => row[b] || 0);

              // branch total sum
              const branchTotal = branchData.reduce((a, b) => a + Number(b), 0);

              // Avr calculation (Plates / KG)
              const kg = Number(row.kg || 0);
              const avr = kg > 0 ? (plate / kg).toFixed(1) : "-";

              return (
                <TableRow key={row.code_no}>
                  <TableCell>{avr}</TableCell>
                  <TableCell>{row.item_name}</TableCell>
                  <TableCell>{kg}</TableCell>
                  <TableCell>{plate}</TableCell>

                  <TableCell>{total}</TableCell>

                  {/* Branch columns */}
                  {branchData.map((v, idx) => (
                    <TableCell key={idx}>{v}</TableCell>
                  ))}

                  <TableCell>{branchTotal}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
