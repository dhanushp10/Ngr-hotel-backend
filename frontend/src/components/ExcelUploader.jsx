import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

/**
 * ExcelUploader Component
 * 
 * @param {function} onDataLoaded - Callback function that receives the parsed JSON data array.
 * @param {string} label - Button label (default: "Upload Excel")
 */
export default function ExcelUploader({ onDataLoaded, label = "Upload Excel" }) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });

                // Get first worksheet
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Convert to JSON
                const data = XLSX.utils.sheet_to_json(ws);

                if (onDataLoaded) {
                    onDataLoaded(data);
                }
            } catch (err) {
                console.error("Error parsing Excel:", err);
                alert("Failed to parse Excel file");
            } finally {
                // Reset input so same file can be selected again if needed
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <>
            <input
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current.click()}
                sx={{ ml: 2 }}
            >
                {label}
            </Button>
        </>
    );
}
