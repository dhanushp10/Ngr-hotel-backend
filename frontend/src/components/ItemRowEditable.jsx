import React, { useEffect, useState } from "react";
import { Grid, TextField } from "@mui/material";
import API from "../api/axios";

export default function ItemRowEditable({ codeNo, setCodeNo, itemName, setItemName, values, setValues, fields = ["qty"], autoFocus=false }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    API.get("/dishes/list-full")
      .then(res => setItems(res.data))
      .catch(() => setItems([]));
  }, []);

  const handleCode = v => {
    setCodeNo(v);
    const found = items.find(it => String(it.code_no) === String(v));
    setItemName(found ? found.item_name : "");
  };

  return (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={2}>
        <TextField label="Code" value={codeNo} fullWidth onChange={e => handleCode(e.target.value)} autoFocus={autoFocus} />
      </Grid>

      <Grid item xs={4}>
        <TextField label="Item" value={itemName} fullWidth disabled />
      </Grid>

      {fields.map(f => (
        <Grid item xs={2} key={f}>
          <TextField label={f.toUpperCase()} value={values[f] || ""} fullWidth onChange={e => setValues({...values, [f]: e.target.value})} />
        </Grid>
      ))}
    </Grid>
  );
}
