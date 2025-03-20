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
import {
  FaChartBar,
  FaProjectDiagram,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../../assets/logo.png";
import "./Sidebar.css";

const Sidebar = ({ collapsed, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const role = currentUser?.role;

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/AuthForms");
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
        {role === "chef_projet" && (
          <ListItem
            button
            component={Link}
            to="/dashboard"
            className={`menu-item ${isActive("/dashboard")}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Tableau de bord" placement="right">
                <FaChartBar />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Tableau de bord"
                primaryTypographyProps={{ component: "span" }} 
              />
            )}
          </ListItem>
        )}

        <ListItem
          button
          component={Link}
          to="/projects"
          className={`menu-item ${isActive("/projects")}`}
        >
          <ListItemIcon className="menu-icon">
            <Tooltip title="Projets" placement="right">
              <FaProjectDiagram />
            </Tooltip>
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Projets"
              primaryTypographyProps={{ component: "span" }} 
            />
          )}
        </ListItem>
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

export default Sidebar;