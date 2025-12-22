import React, {  useState } from "react";
import {
  Paper, Typography, Grid, TextField, Button,
  Table, TableRow, TableHead, TableCell, TableBody,MenuItem
} from "@mui/material";
import API from "../../api/axios";
import BranchSelector from "../../components/BranchSelector";

export default function SaleReportReceive() {
  const [branch, setBranch] = useState("");
  const [session, setSession] = useState("Lunch");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [items, setItems] = useState([]);   // only received items

  // -----------------------------------------------------
  // LOAD RECEIVED SALE REPORT FROM DATABASE
  // -----------------------------------------------------
  const loadExisting = () => {
    if (!branch) {
      alert("Select branch");
      return;
    }

    API.get("/sale-report/get", {
      params: { branch_id: branch, date, session }
    })
      .then((res) => {
        setItems(res.data);
        if (res.data.length === 0) {
          alert("No sale report received yet for this branch.");
        }
      })
      .catch((err) => console.error("LOAD ERROR:", err));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Receive Sale Report (Kitchen)
      </Typography>

      {/* HEADER FILTERS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Branch Selector */}
        <Grid item xs={3}>
          <BranchSelector value={branch} onChange={setBranch} />
        </Grid>

        {/* Session */}
        <Grid item xs={3}>
          <TextField
            select
            fullWidth
            label="Session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <MenuItem value="Lunch">Lunch</MenuItem>
            <MenuItem value="Dinner">Dinner</MenuItem>
          </TextField>
        </Grid>

        {/* Date */}
        <Grid item xs={3}>
          <TextField
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>

        {/* Load Button */}
        <Grid item xs={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={loadExisting}
          >
            Load Report
          </Button>
        </Grid>
      </Grid>

      {/* RECEIVED REPORT TABLE */}
      <Typography variant="h6" sx={{ mt: 2 }}>
        Received Sale Report
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>OB</TableCell>
            <TableCell>Received</TableCell>
            <TableCell>CON</TableCell>
            <TableCell>Others</TableCell>
            <TableCell>COM</TableCell>
            <TableCell>CB</TableCell>
            <TableCell>S&EXES</TableCell>
            <TableCell>Remarks</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.code_no}</TableCell>
              <TableCell>{r.item_name}</TableCell>
              <TableCell>{r.ob}</TableCell>
              <TableCell>{r.received}</TableCell>
              <TableCell>{r.con}</TableCell>
              <TableCell>{r.others}</TableCell>
              <TableCell>{r.com}</TableCell>
              <TableCell>{r.cb}</TableCell>
              <TableCell>{r.s_exes}</TableCell>
              <TableCell>{r.remarks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
