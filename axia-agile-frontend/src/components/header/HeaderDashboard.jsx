import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Popper,
  Paper,
  MenuList,
  MenuItem,
  Grow,
  ClickAwayListener,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { FiUser, FiLogOut, FiHelpCircle } from "react-icons/fi";
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./HeaderDashboard.css";
import NotificationSystem from "../NotificationSystem";
import { useAvatar } from "../../hooks/useAvatar";
import { fetchProfile } from "../../store/slices/profileSlice";
import { fetchCurrentUser } from "../../store/slices/authSlice";
import { useAuth } from "../../contexts/AuthContext";
import { setSnackbar } from "../../store/slices/profileSlice";

const HeaderDashboard = ({ collapsed, toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { logout } = useAuth();

  const { currentUser, isAuthenticated, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const { profile, loading: profileLoading, error: profileError } = useSelector(
    (state) => state.profile
  );

  useEffect(() => {
    if (isAuthenticated && !currentUser && !authLoading) {
      dispatch(fetchCurrentUser());
    }
    if (isAuthenticated && !profile && !profileLoading && !profileError) {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, currentUser, profile, profileLoading, profileError, authLoading, dispatch]);

  // Force refresh avatar when profile photo changes
  useEffect(() => {
    if (profile?.profilePhotoUrl) {
      setAvatarKey(Date.now());
    }
  }, [profile?.profilePhotoUrl]);

  const userData = useMemo(() => {
    return {
      email: profile?.email || currentUser?.email || "",
      firstName: profile?.firstName || currentUser?.firstName || "",
      lastName: profile?.lastName || currentUser?.lastName || "",
      profilePhotoUrl: profile?.profilePhotoUrl || null,
      roleId: profile?.roleId || currentUser?.roleId || null,
    };
  }, [profile, currentUser]);

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return "Super Admin";
      case 2: return "Admin";
      case 3: return "Chef de Projet";
      case 4: return "Membre d'Équipe";
      default: return "Utilisateur";
    }
  };

  const fullName = useMemo(
    () =>
      userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.email || getRoleName(userData.roleId),
    [userData.firstName, userData.lastName, userData.email, userData.roleId]
  );

  const PROFILE_SERVICE_BASE_URL = "http://localhost:5289";
  const profilePhotoUrl = useMemo(() => {
    if (!userData.profilePhotoUrl) return null;
    const baseUrl = userData.profilePhotoUrl.startsWith("http")
      ? userData.profilePhotoUrl
      : `${PROFILE_SERVICE_BASE_URL}${userData.profilePhotoUrl}`;
    return `${baseUrl}?t=${avatarKey}`;
  }, [userData.profilePhotoUrl, avatarKey]);

  const userInitial = useMemo(() => generateInitials(fullName), [fullName]);
  const avatarColor = useMemo(() => getAvatarColor(fullName), [fullName]);

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

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const handleAvatarError = (e) => {
    console.error("Error loading profile photo:", profilePhotoUrl);
    dispatch(
      setSnackbar({
        open: true,
        message: "Impossible de charger la photo de profil.",
        severity: "error",
      })
    );
    e.target.src = "";
    e.target.onerror = null; // Prevent infinite loop
  };

  if (!isAuthenticated || authLoading || (!currentUser && !profile)) {
    return null;
  }

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
        {currentUser?.id && <NotificationSystem userId={currentUser.id} />}

        <div className="user-profile">
          <div
            className="user-avatar"
            ref={anchorRef}
            aria-controls={open ? "menu-list-grow" : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
          >
            {profileLoading ? (
              <CircularProgress size={40} />
            ) : (
              <Avatar
                key={`avatar-${avatarKey}`}
                src={profilePhotoUrl}
                className="avatar"
                style={{ backgroundColor: avatarColor }}
                imgProps={{
                  onError: handleAvatarError,
                }}
              >
                {userInitial}
              </Avatar>
            )}
            <div className="user-info">
              <Typography variant="subtitle2" className="user-name">
                {fullName}
              </Typography>
              <Typography variant="caption" className="user-role">
                {getRoleName(userData.roleId)}
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
                      <MenuItem onClick={handleProfileNavigate} className="menu-item">
                        <FiUser size={16} className="menu-icon" />
                        Mon Profil
                      </MenuItem>
                      <MenuItem onClick={handleHelpNavigate} className="menu-item">
                        <FiHelpCircle size={16} className="menu-icon" />
                        Aide
                      </MenuItem>
                      <MenuItem onClick={handleLogout} className="menu-item logout">
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