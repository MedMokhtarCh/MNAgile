import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderDashboard from '../components/header/HeaderDashboard';
import AdminSidebar from '../components/sidebar/AdminSidebar';
import Sidebar from '../components/sidebar/Sidebar';
import { useSelector } from 'react-redux';
import { mapRoleIdToRole } from '../routes/ProtectedRoute';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useSelector((state) => state.auth);
  const role = currentUser ? mapRoleIdToRole(currentUser.roleId) : null;

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  console.log('DashboardLayout: Rendering', { role, collapsed });

  return (
    <div className="dashboard-layout">
      {role === 'admin' || role === 'superadmin' ? (
        <AdminSidebar collapsed={collapsed} />
      ) : (
        <Sidebar collapsed={collapsed} />
      )}
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