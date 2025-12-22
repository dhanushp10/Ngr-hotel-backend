import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, activeSection, setActiveSection }) {
  return (
    <div>
      {/* TOP NAVBAR */}
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* LEFT SIDEBAR */}
      <Sidebar activeSection={activeSection} />

      {/* MAIN CONTENT AREA (PUSHED RIGHT & DOWN) */}
      <div style={{ marginLeft: 240, marginTop: 70, padding: 20 }}>
        {children}
      </div>
    </div>
  );
}
