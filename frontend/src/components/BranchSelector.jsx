import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { TextField, MenuItem } from "@mui/material";

export default function BranchSelector({ value, onChange, label = "Branch" }) {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    API.get("/branches")
      .then(res => setBranches(res.data))
      .catch(() => setBranches([]));
  }, []);

  return (
    <TextField select fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
    </TextField>
  );
}
