import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import HeaderDashboard from "../components/header/HeaderDashboard";
import { useState } from "react";
import "./DashboardLayout.css";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} />
      <div className="main-content">
        <HeaderDashboard collapsed={collapsed} toggleSidebar={toggleSidebar} />
        <div className="content">
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
