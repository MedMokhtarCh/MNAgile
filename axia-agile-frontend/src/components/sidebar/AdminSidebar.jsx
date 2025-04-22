import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import { FaChartBar, FaUsers, FaSignOutAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import logo from "../../assets/logo.png";
import "./Sidebar.css";

const AdminSidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get currentUser from Redux store
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  // Map backend roleId to frontend role string
  const role = currentUser
    ? currentUser.roleId === 1
      ? "superadmin"
      : currentUser.roleId === 2
      ? "admin"
      : null
    : null;

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLogout = () => {
    dispatch(logout()); // Dispatch Redux logout action
    navigate("/login"); // Use lowercase /login
  };

  // If not authenticated, don't render the sidebar
  if (!isAuthenticated || !role) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 80 : 240,
        transition: "width 0.3s ease-in-out",
        "& .MuiDrawer-paper": {
          width: collapsed ? 80 : 240,
          transition: "width 0.3s ease-in-out",
          backgroundColor: "#fff",
          paddingTop: 2,
          paddingBottom: 2,
        },
      }}
    >
      <div className="logo-container">
        <img
          src={logo}
          alt="Axia Agile"
          className={`logo ${collapsed ? "collapsed-logo" : ""}`}
        />
      </div>

      <List>
        {role === "superadmin" && (
          <>
            <ListItem
              button
              component={Link}
              to="/SuperAdminStatistics"
              className={`menu-item ${isActive("/SuperAdminStatistics")}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Tableau de bord" placement="right">
                  <FaChartBar />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Tableau de bord" />}
            </ListItem>

            <ListItem
              button
              component={Link}
              to="/AdminManagement"
              className={`menu-item ${isActive("/AdminManagement")}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Utilisateurs" placement="right">
                  <FaUsers />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Utilisateurs" />}
            </ListItem>
          </>
        )}

        {role === "admin" && (
          <>
            <ListItem
              button
              component={Link}
              to="/UserStatisticsDashboard"
              className={`menu-item ${isActive("/UserStatisticsDashboard")}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Tableau de bord" placement="right">
                  <FaChartBar />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Tableau de bord" />}
            </ListItem>

            <ListItem
              button
              component={Link}
              to="/UserManagement"
              className={`menu-item ${isActive("/UserManagement")}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Utilisateurs" placement="right">
                  <FaUsers />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Utilisateurs" />}
            </ListItem>
          </>
        )}
      </List>

      <div className="footer-sidebar">
        <IconButton
          onClick={handleLogout}
          sx={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <FaSignOutAlt />
        </IconButton>
      </div>
    </Drawer>
  );
};

export default AdminSidebar;