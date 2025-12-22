import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import MainLayout from "./layout/MainLayout";

// KITCHEN
import Dashboard from "./pages/kitchen/Dashboard";
import KitchenOrders from "./pages/kitchen/KitchenOrders";
import ChickenConversion from "./pages/kitchen/ChickenConversion";
import KitchenStatement from "./pages/kitchen/KitchenStatement";
import SaleReportReceive from "./pages/kitchen/SaleReportReceive";
import DayAnalysis from "./pages/kitchen/DayAnalysis";
import Reports from "./pages/kitchen/Reports";
import DispatchOrders from "./pages/kitchen/DispatchOrders";
import KitchenStock from "./pages/kitchen/KitchenStock";

// HOTEL
import QuickEntry from "./pages/hotel/QuickEntry";
import SendSaleReport from "./pages/hotel/SendSaleReport";
import HotelDispatchHistory from "./pages/hotel/HotelDispatchHistory";

// SHARED
import DateRangeSummary from "./pages/shared/DateRangeSummary";
import BranchEntry from "./pages/shared/BranchEntry";
import DailyEntry from "./pages/shared/DailyEntry";
import History from "./pages/shared/History";

export default function App() {
  // ---------------------------------------
  // Global state for Kitchen / Hotel switch
  // ---------------------------------------
  const [activeSection, setActiveSection] = useState("kitchen");

  return (
    <BrowserRouter>

      {/* Main layout now correctly receives section state */}
      <MainLayout
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <Routes>

          {/* ---------------------- KITCHEN ---------------------- */}
          <Route path="/kitchen/dashboard" element={<Dashboard />} />
          <Route path="/kitchen/orders" element={<KitchenOrders />} />
          <Route path="/kitchen/chicken-conversion" element={<ChickenConversion />} />
          <Route path="/kitchen/statement" element={<KitchenStatement />} />
          <Route path="/kitchen/sale-receive" element={<SaleReportReceive />} />
          <Route path="/kitchen/day-analysis" element={<DayAnalysis />} />
          <Route path="/kitchen/reports" element={<Reports />} />
          <Route
            path="/kitchen/dispatch-orders"
            element={<DispatchOrders />}
          />
          <Route path="/kitchen/stock" element={<KitchenStock />} />

          {/* ---------------------- HOTEL ---------------------- */}
          <Route path="/hotel/place-order" element={<QuickEntry />} />
          <Route path="/hotel/sale-report" element={<SendSaleReport />} />
          <Route path="/hotel/dispatches" element={<HotelDispatchHistory />} />

          {/* ---------------------- SHARED REPORTS ---------------------- */}
          <Route path="/reports/date-range" element={<DateRangeSummary />} />
          <Route path="/reports/branch-entry" element={<BranchEntry />} />
          <Route path="/reports/daily-entry" element={<DailyEntry />} />
          <Route path="/reports/history" element={<History />} />

          {/* DEFAULT REDIRECT */}
          <Route path="/" element={<Dashboard />} />

        </Routes>
      </MainLayout>

    </BrowserRouter>
  );
}
