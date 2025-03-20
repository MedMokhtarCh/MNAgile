
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderDashboard from "../components/header/HeaderDashboard";
import AdminSidebar from "../components/sidebar/AdminSidebar";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <AdminSidebar collapsed={collapsed} onLogout={() => console.log("Logout")} />

      {/* Contenu principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <HeaderDashboard collapsed={collapsed} toggleSidebar={toggleSidebar} />

        {/* Contenu des routes enfants */}
        <div style={{ flex: 1, padding: "24px", marginTop: "64px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;