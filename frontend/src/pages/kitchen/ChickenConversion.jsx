import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import API from "../../api/axios";
import ExcelUploader from "../../components/ExcelUploader";

// Mapping: code (DB ID) -> name (User Custom Name)
// If code is null, it's an Extra Item not in DB yet (CKN PCS, etc)
const DISPLAY_MAP = [
  { code: "12", name: "CB" },
  { code: null, name: "CKN PCS" },
  { code: null, name: "LEG-PCS" },
  { code: "1", name: "CC" },
  { code: "2", name: "CF" },
  { code: "4", name: "C.65" },
  { code: "3", name: "CR" },
  { code: "7", name: "CK" },
  { code: "51", name: "CP" },
  { code: "80", name: "GTR-SD" },
  { code: "57", name: "C.N.SD" },   // CNSD
  { code: "49", name: "C.LMN" },    // C.LEMON
  { code: "83", name: "CKP" },      // KARIVEP...
  { code: "213", name: "CNR" },
  { code: "5", name: "C.SIXER" },
  { code: "38", name: "CM" },
  { code: "151", name: "CNG" },
  { code: null, name: "CBLG" },
  { code: "215", name: "CLP" },
  { code: "50", name: "CCBNLS" },
  { code: null, name: "CW" },
  { code: "14", name: "MB" },
  { code: null, name: "E.B.RICE" },
  { code: "53", name: "MCH" },      // M.CURRY
  { code: "8", name: "MF" },
  { code: "55", name: "MPBL" },
  { code: "9", name: "MRST" },      // M.ROAST
  { code: "54", name: "MKB" },
  { code: "93", name: "MKF" },      // M.KHEEMA
  { code: null, name: "MW" },
  { code: "32", name: "NKM" },
  { code: "31", name: "NKF" },
  { code: "17", name: "FF" },
  { code: "18", name: "FC" },
  { code: "84", name: "F 65" },     // FISH 65
  { code: "33", name: "Fish sima" },// FISH SIMHAPURI
  { code: null, name: "PSK" },
  { code: "114", name: "PRNS" },
  { code: "35", name: "VB" },
  { code: null, name: "BSK" },
  { code: null, name: "GSK" },
  { code: "27", name: "PBM" },
  { code: null, name: "MSK" },
  { code: null, name: "Egg sholay" }
];

export default function ChickenConversion() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState({}); // { code_no: { kg: val, plates: val } }
  const [gridItems, setGridItems] = useState([]);
  const [msg, setMsg] = useState("");

  const loadData = useCallback(() => {
    // 1. Load saved stats for this date from Backend
    API.get("/kitchen/daily-stats", { params: { date } })
      .then((res) => {
        const statsMap = {};
        if (res.data) {
          res.data.forEach((r) => {
            statsMap[r.code_no] = { kg: r.kg, plates: r.plates };
          });
        }
        setData(statsMap);

        // 2. Build the Grid Items
        // We do strictly what is in DISPLAY_MAP.
        // If code exists, we link it for saving.
        // If code is null, we use name as temporary ID.

        const builtItems = DISPLAY_MAP.map(item => {
          const id = item.code || item.name; // Use DB code if valid, else Name
          return {
            id: id,
            code_no: item.code, // Can be null
            name: item.name,
            is_extra: !item.code
          };
        });

        setGridItems(builtItems);
      })
      .catch(console.error);
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (id, field, val) => {
    setData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: val },
    }));
  };

  const save = () => {
    // We only save items that have a valid DB code
    const items = [];

    Object.entries(data).forEach(([id, obj]) => {
      // Find if this ID corresponds to a real code
      const isReal = DISPLAY_MAP.find(m => m.code === id);
      if (isReal) {
        items.push({
          code_no: id,
          kg: Number(obj?.kg) || 0,
          plates: Number(obj?.plates) || 0
        });
      }
    });

    API.post("/kitchen/daily-stats", { date, items })
      .then(() => setMsg("Saved successfully (Mapped items only)!"))
      .catch((err) => {
        console.error(err);
        setMsg("Error saving data");
      });
  };

  const handleExcelUpload = (uploadedData) => {
    const map = { ...data };
    let count = 0;

    uploadedData.forEach(row => {
      // Excel Columns: "Items" or "Item Name", "KG", "Plates"
      // User's Excel matches the Name in DISPLAY_MAP

      const rowName = row["Items"] || row["Item"] || row["Item Name"] || row["Name"];

      if (!rowName) return;

      // Find in MAPPING by Name
      const found = DISPLAY_MAP.find(m => m.name.toLowerCase() === String(rowName).toLowerCase());

      if (found) {
        const id = found.code || found.name;
        const kg = row["KG"] || row["KGS"] || row["kg"] || 0;
        const plates = row["Plates"] || row["plates"] || 0;

        map[id] = {
          ...map[id],
          kg: Number(kg) || 0,
          plates: Number(plates) || 0
        };
        count++;
      }
    });

    setData(map);
    setMsg(`Uploaded ${count} items from Excel`);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Daily Item Consumption (KG Entry)
      </Typography>

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
          <Button variant="contained" onClick={save} sx={{ height: "56px" }}>
            Save Changes
          </Button>
        </Grid>
        <Grid item xs={3}>
          <div style={{ marginTop: '10px' }}>
            <ExcelUploader onDataLoaded={handleExcelUpload} label="Upload Excel" />
          </div>
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#eee" }}>
            <TableCell>Code</TableCell>
            <TableCell>Item Name</TableCell>
            <TableCell>KGS (Enter)</TableCell>
            <TableCell>Plates (Enter)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gridItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.is_extra ? "-" : item.code_no}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  placeholder="KG"
                  value={data[item.id]?.kg || ""}
                  onChange={(e) => handleChange(item.id, "kg", e.target.value)}
                  sx={{ width: "100px" }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  placeholder="Plates"
                  value={data[item.id]?.plates || ""}
                  onChange={(e) => handleChange(item.id, "plates", e.target.value)}
                  sx={{ width: "100px" }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Snackbar
        open={!!msg}
        autoHideDuration={3000}
        onClose={() => setMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={msg.includes("Error") ? "error" : "success"}>
          {msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
