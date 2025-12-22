// import React from "react";
// import {
//   Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, ListSubheader
// } from "@mui/material";

// import {
//   Dashboard as DashboardIcon,
//   Assignment as AssignmentIcon,
//   Restaurant as RestaurantIcon,
//   Description as DescriptionIcon,
//   Receipt as ReceiptIcon,
//   Analytics as AnalyticsIcon,
//   CalendarMonth as CalendarMonthIcon,
//   Inventory as InventoryIcon,
//   ShoppingCart as ShoppingCartIcon,
//   LocalHotel as HotelIcon
// } from "@mui/icons-material";

// import { Link, useLocation } from "react-router-dom";

// const drawerWidth = 240;

// const kitchenMenu = [
//   { label: "Dashboard", path: "/kitchen/dashboard", icon: <DashboardIcon /> },
//   { label: "Order Record", path: "/kitchen/orders", icon: <AssignmentIcon /> },
//   { label: "Chicken → Plates", path: "/kitchen/chicken-conversion", icon: <RestaurantIcon /> },
//   { label: "Kitchen Statement", path: "/kitchen/statement", icon: <DescriptionIcon /> },
//   { label: "Receive Sale Reports", path: "/kitchen/sale-receive", icon: <ReceiptIcon /> },
//   { label: "Day Analysis", path: "/kitchen/day-analysis", icon: <AnalyticsIcon /> },
//   { label: "Lunch Report", path: "/kitchen/lunch-report", icon: <CalendarMonthIcon /> },
//   { label: "Dinner Report", path: "/kitchen/dinner-report", icon: <CalendarMonthIcon /> },
//   { label: "Monthly Summary", path: "/kitchen/monthly-summary", icon: <CalendarMonthIcon /> },
//   { label: "Yearly Summary", path: "/kitchen/yearly-summary", icon: <CalendarMonthIcon /> },
//   { label: "Product Report", path: "/kitchen/product-report", icon: <InventoryIcon /> }
// ];

// const hotelMenu = [
//   { label: "Place Order", path: "/hotel/place-order", icon: <ShoppingCartIcon /> },
//   { label: "Send Sale Report", path: "/hotel/sale-report", icon: <HotelIcon /> }
// ];

// export default function Sidebar({ activeSection }) {
//   const location = useLocation();
//   const isActive = (path) => location.pathname === path;

//   const menu = activeSection === "kitchen" ? kitchenMenu : hotelMenu;
//   const header = activeSection === "kitchen" ? "Kitchen" : "Hotel";

//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         width: drawerWidth,
//         [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }
//       }}
//     >
//       <Toolbar />
//       <List subheader={<ListSubheader>{header} Menu</ListSubheader>}>

//         {menu.map((item) => (
//           <ListItemButton
//             key={item.path}
//             component={Link}
//             to={item.path}
//             selected={isActive(item.path)}
//           >
//             <ListItemIcon>{item.icon}</ListItemIcon>
//             <ListItemText primary={item.label} />
//           </ListItemButton>
//         ))}

//       </List>
//     </Drawer>
//   );
// }

import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  ListSubheader
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Restaurant as RestaurantIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  CalendarMonth as CalendarMonthIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalHotel as HotelIcon,
  LocalShipping as DispatchIcon
} from "@mui/icons-material";

import { Link, useLocation } from "react-router-dom";

const drawerWidth = 240;

/* ===================== KITCHEN MENU ===================== */
const kitchenMenu = [
  { label: "Dashboard", path: "/kitchen/dashboard", icon: <DashboardIcon /> },

  // ⭐ NEW DISPATCH FLOW
  { label: "Dispatch Orders", path: "/kitchen/dispatch-orders", icon: <DispatchIcon /> },

  { label: "Order Record", path: "/kitchen/orders", icon: <AssignmentIcon /> },
  { label: "Chicken → Plates", path: "/kitchen/chicken-conversion", icon: <RestaurantIcon /> },
  { label: "Kitchen Statement", path: "/kitchen/statement", icon: <DescriptionIcon /> },
  { label: "Stock Register", path: "/kitchen/stock", icon: <InventoryIcon /> },
  { label: "Receive Sale Reports", path: "/kitchen/sale-receive", icon: <ReceiptIcon /> }
];

/* ===================== HOTEL MENU ===================== */
const hotelMenu = [
  { label: "Place Order", path: "/hotel/place-order", icon: <ShoppingCartIcon /> },
  { label: "Send Sale Report", path: "/hotel/sale-report", icon: <HotelIcon /> },
  { label: "Dispatch History", path: "/hotel/dispatches", icon: <DispatchIcon /> }
];

export default function Sidebar({ activeSection }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const menu = activeSection === "kitchen" ? kitchenMenu : hotelMenu;
  const header = activeSection === "kitchen" ? "Kitchen" : "Hotel";

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box"
        }
      }}
    >
      <Toolbar />

      <List subheader={<ListSubheader>{header} Menu</ListSubheader>}>
        {menu.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={isActive(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}

        {/* NEW REPORT SYSTEM */}
        {activeSection === "kitchen" && (
          <ListItemButton
            component={Link}
            to="/kitchen/reports"
            selected={isActive("/kitchen/reports")}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        )}
      </List>
    </Drawer>
  );
}
