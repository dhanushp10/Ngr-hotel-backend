import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Navbar({ activeSection, setActiveSection }) {
  const navigate = useNavigate();

  const handleKitchenClick = () => {
    setActiveSection("kitchen");
    navigate("/kitchen/dashboard");
  };

  const handleHotelClick = () => {
    setActiveSection("hotel");
    navigate("/hotel/place-order");
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: 2000 }}>
      <Toolbar>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Food Dispatch Management
        </Typography>

        {/* SWITCH BUTTONS */}
        <Button
          color={activeSection === "kitchen" ? "secondary" : "inherit"}
          onClick={handleKitchenClick}
        >
          Kitchen
        </Button>

        <Button
          color={activeSection === "hotel" ? "secondary" : "inherit"}
          onClick={handleHotelClick}
        >
          Hotel
        </Button>

      </Toolbar>
    </AppBar>
  );
}
