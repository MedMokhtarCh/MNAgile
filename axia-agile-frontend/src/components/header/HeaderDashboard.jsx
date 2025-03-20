import React, { useState, useRef } from "react";
import { InputBase, Popper, Paper, MenuList, MenuItem, Grow, ClickAwayListener } from "@mui/material";
import { FiBell, FiUser, FiLogOut } from "react-icons/fi";
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import "./HeaderDashboard.css";

const HeaderDashboard = ({ collapsed, toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/AuthForms");
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

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  // Return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <header className="header">
      <div className="toggle-button" onClick={toggleSidebar}>
        {collapsed ? <AiOutlineMenuUnfold size={20} /> : <AiOutlineMenuFold size={20} />}
      </div>

      {/* <InputBase placeholder="Rechercher..." className="search" /> */}

      <div className="icons">
        <FiBell size={20} className="icon" />
        <div 
          className="avatar-circle" 
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <FiUser size={20} className="icon" />
        </div>
        <Popper 
          open={open} 
          anchorEl={anchorRef.current} 
          role={undefined} 
          transition 
          disablePortal
          placement="bottom-end"
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
            >
              <Paper elevation={3}>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem onClick={handleClose}>
                      <FiUser size={16} style={{ marginRight: 8 }} />
                      Profil
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <FiLogOut size={16} style={{ marginRight: 8 }} />
                      Déconnexion
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </header>
  );
};

export default HeaderDashboard;