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
import logo from "../../assets/logo.png";
import "./Sidebar.css";

const AdminSidebar = ({ collapsed, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const role = currentUser?.role;

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/Login");
  };

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

      {/* Bouton de déconnexion */}
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