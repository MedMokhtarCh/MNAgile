import React, { useState, useRef } from "react";
import {
  Popper,
  Paper,
  MenuList,
  MenuItem,
  Grow,
  ClickAwayListener,
  Typography,
  Avatar,
} from "@mui/material";
import {
  FiUser,
  FiLogOut,
  FiHelpCircle,
} from "react-icons/fi";
import {
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./HeaderDashboard.css";
import NotificationSystem from "../NotificationSystem";
import { useAvatar } from "../../hooks/useAvatar";

const HeaderDashboard = ({ collapsed, toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const { generateInitials, getAvatarColor } = useAvatar();

  // Get profile data from Redux store
  const { profile } = useSelector((state) => state.profile);

  // Fallback to localStorage if profile is not available (optional)
  const currentUser = profile || JSON.parse(localStorage.getItem("currentUser")) || {};

  // Standardize fullName for consistent avatar color
  const fullName = currentUser.firstName && currentUser.lastName
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser.email || "Utilisateur";

  // Construct profile photo URL with cache-busting
  const PROFILE_SERVICE_BASE_URL = "https://localhost:7240";
  const profilePhotoUrl = currentUser.profilePhotoUrl
    ? currentUser.profilePhotoUrl.startsWith("http")
      ? `${currentUser.profilePhotoUrl}?t=${Date.now()}`
      : `${PROFILE_SERVICE_BASE_URL}${currentUser.profilePhotoUrl}?t=${Date.now()}`
    : null;

  const userInitial = generateInitials(fullName);
  const avatarColor = getAvatarColor(fullName);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/Login");
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleProfileNavigate = () => {
    navigate("/profile");
    setOpen(false);
  };

  const handleHelpNavigate = () => {
    navigate("/help");
    setOpen(false);
  };

  return (
    <header className="header-dashboard">
      <div className="header-left">
        <div className="toggle-button" onClick={toggleSidebar}>
          {collapsed ? (
            <AiOutlineMenuUnfold size={22} className="toggle-icon" />
          ) : (
            <AiOutlineMenuFold size={22} className="toggle-icon" />
          )}
        </div>
      </div>

      <div className="header-right">
        <NotificationSystem currentUser={currentUser} />

        <div className="user-profile">
          <div
            className="user-avatar"
            ref={anchorRef}
            aria-controls={open ? "menu-list-grow" : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
          >
            <Avatar
              src={profilePhotoUrl}
              className="avatar"
              style={{ backgroundColor: avatarColor }}
              imgProps={{
                onError: (e) => {
                  console.error("Error loading profile photo:", profilePhotoUrl);
                  e.target.src = ""; // Force fallback to initials
                },
                onLoad: () => {
                  console.log("Profile photo loaded successfully:", profilePhotoUrl);
                },
              }}
            >
              {userInitial}
            </Avatar>
            <div className="user-info">
              <Typography variant="subtitle2" className="user-name">
                {fullName}
              </Typography>
              <Typography variant="caption" className="user-role">
                {currentUser.role === "superadmin"
                  ? "Super Admin"
                  : currentUser.role === "admin"
                  ? "Admin"
                  : currentUser.role === "chef_projet"
                  ? "Chef de Projet"
                  : "Utilisateur"}
              </Typography>
            </div>
          </div>

          <Popper
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
            placement="bottom-end"
            className="user-menu-popper"
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === "bottom" ? "center top" : "center bottom",
                }}
              >
                <Paper elevation={3} className="user-menu-paper">
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList
                      autoFocusItem={open}
                      id="menu-list-grow"
                      className="user-menu-list"
                    >
                      <MenuItem
                        onClick={handleProfileNavigate}
                        className="menu-item"
                      >
                        <FiUser size={16} className="menu-icon" />
                        Mon Profil
                      </MenuItem>
                      <MenuItem
                        onClick={handleHelpNavigate}
                        className="menu-item"
                      >
                        <FiHelpCircle size={16} className="menu-icon" />
                        Aide
                      </MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        className="menu-item logout"
                      >
                        <FiLogOut size={16} className="menu-icon" />
                        Déconnexion
                      </MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;