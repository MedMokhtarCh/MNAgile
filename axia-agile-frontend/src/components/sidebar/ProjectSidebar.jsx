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
  Collapse,
} from '@mui/material';
import {
  FaChartBar,
  FaListAlt,
  FaCalendar,
  FaRegCommentDots,
  FaTasks,
  FaSignOutAlt,
  FaAngleDown,
  FaAngleUp,
  FaClipboardList,
  FaPlay,
  FaArrowLeft,
} from 'react-icons/fa';
import FolderIcon from '@mui/icons-material/Folder';
import './Sidebar.css';

const ProjectSidebar = ({ collapsed, projectId, projectTitle }) => {
  const [openScrum, setOpenScrum] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleScrumToggle = () => {
    setOpenScrum((prev) => !prev);
  };

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
          alignItems: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1 : 2,
          py: 1,
          mb: 1,
        }}
      >
        {collapsed ? (
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
        ) : (
          <Box
            display="flex"
            sx={{
              width: '100%',
              flexDirection: 'column',
            }}
          >
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
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

        <ListItem
          button
          className={`menu-item ${isActive(`/project/${projectId}/backlog`) ||
            isActive(`/project/${projectId}/ActiveSprintPage`)}`}
          onClick={handleScrumToggle}
        >
          <ListItemIcon className="menu-icon">
            <Tooltip title="Scrum" placement="right">
              <FaTasks />
            </Tooltip>
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Scrum" />}
          {!collapsed &&
            (openScrum ? (
              <FaAngleUp className="scrum-toggle-icon" />
            ) : (
              <FaAngleDown className="scrum-toggle-icon" />
            ))}
        </ListItem>

        <Collapse in={openScrum} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem
              button
              component={Link}
              to={`/project/${projectId}/backlog`}
              className={`menu-item submenu-item ${isActive(
                `/project/${projectId}/backlog`
              )}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Backlog" placement="right">
                  <FaClipboardList />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Backlog" />}
            </ListItem>

            <ListItem
              button
              component={Link}
              to={`/project/${projectId}/ActiveSprintPage`}
              className={`menu-item submenu-item ${isActive(
                `/project/${projectId}/ActiveSprintPage`
              )}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Sprint" placement="right">
                  <FaPlay />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Sprint" />}
            </ListItem>
          </List>
        </Collapse>

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

        <ListItem
          button
          component={Link}
          to={`/project/${projectId}/GroupDiscussion`}
          className={`menu-item ${isActive(
            `/project/${projectId}/GroupDiscussion`
          )}`}
        >
          <ListItemIcon className="menu-icon">
            <Tooltip title="Messages" placement="right">
              <FaRegCommentDots />
            </Tooltip>
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Messages" />}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default ProjectSidebar;