import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import {
  FaChartBar,
  FaListAlt,
  FaCalendar,
  FaClipboardList,
  FaPlay,
  FaArrowLeft,
} from 'react-icons/fa';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import FolderIcon from '@mui/icons-material/Folder';
import { useSelector } from 'react-redux';
import './Sidebar.css';

const ProjectSidebar = ({ projectId, projectTitle }) => {
  const [collapsed, setCollapsed] = useState(false); // Local state for collapsed
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  // Claims for task-related access (Backlog, Kanban)
  const taskRelatedClaims = [
    'CanViewTasks',
    'CanCreateTasks',
    'CanUpdateTasks',
    'CanDeleteTasks',
    'CanViewBacklogs',
    'CanCreateBacklogs',
    'CanUpdateBacklogs',
    'CanDeleteBacklogs',
    'CanViewSprints',
    'CanCreateSprints',
    'CanUpdateSprints',
    'CanDeleteSprints',
  ];
  const hasTaskRelatedClaims = currentUser?.claims?.some((claim) =>
    taskRelatedClaims.includes(claim)
  );

  // Claims specifically for Calendar and Sprint visibility
  const viewClaims = ['CanViewTasks', 'CanViewBacklogs', 'CanViewSprints'];
  const hasViewClaims = currentUser?.claims?.some((claim) =>
    viewClaims.includes(claim)
  );

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const getProjectColor = (title) => {
    const colors = [
      '#3f51b5',
      '#2196f3',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#ff9800',
      '#ff5722',
      '#795548',
    ];
    let sum = 0;
    const safeTitle = title || '';
    for (let i = 0; i < safeTitle.length; i++) {
      sum += safeTitle.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Only render sidebar for authenticated users
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 80 : 240,
        transition: 'width 0.3s ease-in-out',
        '& .MuiDrawer-paper': {
          width: collapsed ? 80 : 240,
          transition: 'width 0.3s ease-in-out',
          backgroundColor: '#fff',
          paddingTop: 2,
          paddingBottom: 2,
        },
      }}
    >
      {/* Toggle Button and Project Title */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'space-between',
          alignItems: 'center',
          px: collapsed ? 1 : 2,
          py: 1,
          mb: 1,
        }}
      >
        {collapsed ? (
          <>
            <Tooltip title={projectTitle} placement="right">
              <Avatar
                sx={{
                  bgcolor: getProjectColor(projectTitle),
                  width: 45,
                  height: 45,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <FolderIcon />
              </Avatar>
            </Tooltip>
            <div className="toggle-button" onClick={toggleSidebar}>
              <AiOutlineMenuUnfold size={22} className="toggle-icon" />
            </div>
          </>
        ) : (
          <Box
            display="flex"
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  bgcolor: getProjectColor(projectTitle),
                  width: 38,
                  height: 38,
                  mr: 1.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <FolderIcon />
              </Avatar>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                sx={{
                  fontSize: '15px',
                  background: 'linear-gradient(45deg, #3a8ef6, #6f42c1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.01em',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  lineHeight: 1.3,
                  whiteSpace: 'normal',
                  display: 'block',
                }}
              >
                {projectTitle}
              </Typography>
            </Box>
            <div className="toggle-button" onClick={toggleSidebar}>
              <AiOutlineMenuFold size={22} className="toggle-icon" />
            </div>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <ListItem
        button
        onClick={() => navigate('/projects')}
        className="menu-item"
        sx={{
          mb: 1,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 2,
        }}
      >
        <ListItemIcon className="menu-icon">
          <Tooltip title="Retour aux Projets" placement="right">
            <FaArrowLeft />
          </Tooltip>
        </ListItemIcon>
        {!collapsed && <ListItemText primary="Retour aux Projets" />}
      </ListItem>

      <List>
        <ListItem
          button
          component={Link}
          to={`/project/${projectId}`}
          className={`menu-item ${isActive(`/project/${projectId}`)}`}
        >
          <ListItemIcon className="menu-icon">
            <Tooltip title="Vue d'Ensemble" placement="right">
              <FaChartBar />
            </Tooltip>
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Vue d'Ensemble" />}
        </ListItem>

        {/* Conditionally render Backlog menu item based on claims */}
        {hasTaskRelatedClaims && (
          <ListItem
            button
            component={Link}
            to={`/project/${projectId}/backlog`}
            className={`menu-item ${isActive(`/project/${projectId}/backlog`)}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Backlog" placement="right">
                <FaClipboardList />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Backlog" />}
          </ListItem>
        )}

        {/* Conditionally render Kanban menu item based on claims */}
        {hasTaskRelatedClaims && (
          <ListItem
            button
            component={Link}
            to={`/project/${projectId}/kanban`}
            className={`menu-item ${isActive(`/project/${projectId}/kanban`)}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Kanban" placement="right">
                <FaListAlt />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Kanban" />}
          </ListItem>
        )}

        {/* Conditionally render Sprint menu item based on claims */}
        {hasViewClaims && (
          <ListItem
            button
            component={Link}
            to={`/project/${projectId}/ActiveSprintPage`}
            className={`menu-item ${isActive(`/project/${projectId}/ActiveSprintPage`)}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Sprint" placement="right">
                <FaPlay />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Sprint" />}
          </ListItem>
        )}

        {/* Conditionally render Calendar menu item based on claims */}
        {hasViewClaims && (
          <ListItem
            button
            component={Link}
            to={`/project/${projectId}/calendar`}
            className={`menu-item ${isActive(`/project/${projectId}/calendar`)}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Calendrier" placement="right">
                <FaCalendar />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Calendrier" />}
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

export default ProjectSidebar;