import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  Paper, Typography, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TextField
} from "@mui/material";
import { useParams } from "react-router-dom";

export default function BranchEntry() {
  const { dispatchId } = useParams();
  const [branchId, setBranchId] = useState(1);
  const [rows, setRows] = useState([]);

  // Load orders
  const loadData = () => {
    API.get(`/orders/${dispatchId}/${branchId}`).then(res => setRows(res.data));
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const handleChange = (index, value) => {
    const updated = [...rows];
    updated[index].qty = Number(value);
    setRows(updated);
  };

  const save = () => {
    API.post("/orders/save", {
      dispatchId,
      branchId,
      orders: rows
    }).then(() => alert("Saved Successfully!"));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Branch Entry — Branch {branchId}</Typography>

      <Button
        variant="outlined"
        sx={{ mt: 2, mb: 2 }}
        onClick={() => setBranchId(branchId % 7 + 1)}
      >
        Switch Branch
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Qty</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.code_no}>
              <TableCell>{r.code_no}</TableCell>
              <TableCell>{r.item_name}</TableCell>
              <TableCell>{r.rate}</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  variant="outlined"
                  size="small"
                  value={r.qty}
                  onChange={(e) => handleChange(i, e.target.value)}
                  sx={{ width: "90px" }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button variant="contained" sx={{ mt: 2 }} onClick={save}>
        Save
      </Button>
    </Paper>
  );
}
