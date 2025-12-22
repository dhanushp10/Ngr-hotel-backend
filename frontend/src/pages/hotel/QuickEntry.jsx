import React, { useState, useEffect } from "react";
import {
  Paper, Typography, Grid, Button, Table,
  TableHead, TableRow, TableCell, TableBody, TextField, MenuItem, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import API from "../../api/axios";
import ItemRowEditable from "../../components/ItemRowEditable";
import ExcelUploader from "../../components/ExcelUploader";

export default function QuickEntry() {
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState("");
  const [session, setSession] = useState("Lunch");

  const [codeNo, setCodeNo] = useState("");
  const [itemName, setItemName] = useState("");
  const [values, setValues] = useState({ qty: "" });

  const [list, setList] = useState([]);
  const [dishes, setDishes] = useState([]);

  // ------------------------------------------------------
  // LOAD BRANCHES + DISHES
  // ------------------------------------------------------
  useEffect(() => {
    API.get("/branches")
      .then((res) => setBranches(res.data))
      .catch(console.error);

    API.get("/dishes/list-full")
      .then((res) => {
        // console.log("Loaded Dishes (first item):", res.data[0]);
        setDishes(res.data);
      })
      .catch(console.error);
  }, []);

  // ------------------------------------------------------
  // AUTO-FILL ITEM NAME
  // ------------------------------------------------------


  useEffect(() => {
    if (!codeNo) return setItemName("");

    const found = dishes.find(d =>
      String(d.code_no).toLowerCase() === String(codeNo).toLowerCase()
    );

    setItemName(found ? found.item_name : "");
  }, [codeNo, dishes]);

  // ------------------------------------------------------
  // ADD ITEM
  // ------------------------------------------------------
  const add = () => {
    if (!codeNo || !values.qty) return alert("Code and qty required");
    if (!itemName) return alert("Invalid code");

    const found = dishes.find(d =>
      String(d.code_no).toLowerCase() === String(codeNo).toLowerCase()
    );

    if (!found) return alert("Invalid code");

    const numericCode = found.code_no;
    const itemCode = found.item_name;

    const existing = list.find(i => i.code === numericCode);

    if (existing) {
      existing.qty = Number(existing.qty) + Number(values.qty);
      setList([...list]);
    } else {
      setList([
        ...list,
        {
          code: numericCode,           // numeric code (12, 14, 35, etc.)
          item: itemCode,              // item code (CB, MB, VB, etc.)
          code_no: numericCode,        // For backend compatibility (now matches 12, 14)
          qty: Number(values.qty)
        }
      ]);
    }

    setCodeNo("");
    setItemName("");
    setValues({ qty: "" });
  };

  const removeAt = (index) => {
    const copy = [...list];
    copy.splice(index, 1);
    setList(copy);
  };

  const removeAll = () => {
    if (window.confirm("Are you sure you want to remove ALL items?")) {
      setList([]);
    }
  };

  // ------------------------------------------------------
  // SUBMIT ORDER
  // ------------------------------------------------------
  const submit = async () => {
    if (!branch) return alert("Select branch");
    if (!list.length) return alert("No items added");

    try {
      await API.post("/orders/quick-batch", {
        branch_id: branch,
        items: list,
        session
      });

      alert("Order Saved Successfully!");
      setList([]);

    } catch (err) {
      console.error(err);
      alert("Error saving order");
    }
  };

  const handleExcelUpload = (uploadedData) => {
    let newItems = [];

    uploadedData.forEach(row => {
      // Expected columns: "Code" (numeric 12, 14 or 1a), "Qty"
      const codeRaw = row["Code"] || row["Code No"] || row["CodeNO"] || row["code"];
      const qtyRaw = row["Qty"] || row["qty"] || row["QNT"];

      if (!codeRaw || !qtyRaw) return;

      const found = dishes.find(d =>
        String(d.code_no).toLowerCase() === String(codeRaw).toLowerCase()
      );

      if (found) {
        newItems.push({
          code: found.code_no,       // numeric code (12, 14, etc.)
          item: found.item_name,     // item name (CB, MB, etc.)
          code_no: found.code_no,    // for backend
          qty: Number(qtyRaw)
        });
      }
    });

    if (newItems.length > 0) {
      setList(prev => [...prev, ...newItems]);
      alert(`Added ${newItems.length} items from Excel`);
    } else {
      alert("No valid items found in Excel (Check columns: Code, Qty)");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Place Order (Hotel)
      </Typography>

      {/* BRANCH + SESSION */}
      <Grid container spacing={2} sx={{ mb: 2 }}>

        {/* Branch Dropdown */}
        {/* Branch Dropdown */}
        <Grid item xs={4}>
          <TextField
            label="Branch"
            fullWidth
            select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
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
      </Grid>


      {/* EXCEL UPLOAD */}
      <Grid container sx={{ mb: 2 }}>
        <ExcelUploader onDataLoaded={handleExcelUpload} label="Bulk Upload via Excel" />
      </Grid>

      {/* ITEM ENTRY */}
      <ItemRowEditable
        codeNo={codeNo}
        setCodeNo={setCodeNo}
        itemName={itemName}
        setItemName={setItemName}
        values={values}
        setValues={setValues}
        fields={["qty"]}
        autoFocus={true}
      />

      {/* ADD + CLEAR */}
      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid item xs={2}>
          <Button variant="contained" onClick={add}>Add</Button>
        </Grid>

        <Grid item xs={2}>
          <Button variant="outlined" onClick={() => {
            setCodeNo("");
            setItemName("");
            setValues({ qty: "" });
          }}>
            Clear
          </Button>
        </Grid>

        <Grid item xs={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={removeAll}
            disabled={list.length === 0}
          >
            Remove
          </Button>
        </Grid>
      </Grid>

      {/* TABLE */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {list.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.item}</TableCell>
              <TableCell>{row.qty}</TableCell>
              <TableCell>
                <IconButton color="error" size="small" onClick={() => removeAt(idx)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* SUBMIT */}
      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2 }}
        onClick={submit}
      >
        Submit Orders
      </Button>
    </Paper >
  );
}
