import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import { FaChartBar, FaProjectDiagram, FaSignOutAlt, FaCalendarAlt, FaRegCommentDots } from 'react-icons/fa';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import logo from '../../assets/logo.png';
import { useProject } from '../../hooks/useProjects';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const { status } = useSelector((state) => state.projects);
  const { getFilteredProjects } = useProject();

  // Map backend roleId to frontend role string
  const role = currentUser
    ? currentUser.roleId === 3
      ? 'chef_projet'
      : currentUser.roleId === 4
      ? 'user'
      : null
    : null;

  // Claims for user management access
  const userManagementClaims = [
    'CanViewUsers',
    'CanCreateUsers',
    'CanUpdateUsers',
    'CanDeleteUsers',
  ];
  const hasUserManagementClaims = currentUser?.claims?.some((claim) =>
    userManagementClaims.includes(claim)
  );

  // Claims for discussion access
  const discussionClaims = ['CanCommunicate', 'CanCreateChannel'];
  const hasDiscussionClaims = currentUser?.claims?.some((claim) =>
    discussionClaims.includes(claim)
  );

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  // Function to get project color based on title
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

  // Get filtered projects using the same logic as the Projects page
  const filteredProjects = getFilteredProjects();

  // Get the three most recent projects, sorted by createdAt
  const recentProjects = filteredProjects
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // If not authenticated or no valid role, don't render the sidebar
  if (!isAuthenticated || !role) {
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
      <div className="logo-container">
        <img
          src={logo}
          alt="Axia Agile"
          className={`logo ${collapsed ? 'collapsed-logo' : ''}`}
        />
      </div>

      <List>
        {role === 'chef_projet' && (
          <ListItem
            button
            component={Link}
            to="/dashboard"
            className={`menu-item ${isActive('/dashboard')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Tableau de bord" placement="right">
                <FaChartBar />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Tableau de bord"
                primaryTypographyProps={{ component: 'span' }}
              />
            )}
          </ListItem>
        )}

        {(role === 'chef_projet' || role === 'user') && (
          <ListItem
            button
            component={Link}
            to="/projects"
            className={`menu-item ${isActive('/projects')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Projets" placement="right">
                <FaProjectDiagram />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Projets"
                primaryTypographyProps={{ component: 'span' }}
              />
            )}
          </ListItem>
        )}

        {(role === 'chef_projet' || role === 'user') && (
          <ListItem
            button
            component={Link}
            to="/meetings"
            className={`menu-item ${isActive('/meetings')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Réunions" placement="right">
                <FaCalendarAlt />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Réunions"
                primaryTypographyProps={{ component: 'span' }}
              />
            )}
          </ListItem>
        )}

        {/* Messages menu item for users with discussion claims */}
        {hasDiscussionClaims && (
          <ListItem
            button
            component={Link}
            to="/messages"
            className={`menu-item ${isActive('/messages')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Messages" placement="right">
                <FaRegCommentDots />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Messages"
                primaryTypographyProps={{ component: 'span' }}
              />
            )}
          </ListItem>
        )}

        {/* User Management menu item for users with required claims */}
        {hasUserManagementClaims && (
          <ListItem
            button
            component={Link}
            to="/UserManagement"
            className={`menu-item ${isActive('/UserManagement')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Gestion des Utilisateurs" placement="right">
                <PeopleIcon />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Utilisateurs"
                primaryTypographyProps={{ component: 'span' }}
              />
            )}
          </ListItem>
        )}
      </List>

      {/* Recent Projects Section */}
      {(role === 'chef_projet' || role === 'user') && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ px: 2, mb: 1 }}>
            {!collapsed && (
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                Projets Récents
              </Typography>
            )}
          </Box>
          <List>
            {status === 'loading' ? (
              <Box sx={{ px: 2, py: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Chargement...
                </Typography>
              </Box>
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <ListItem
                  key={project.id}
                  button
                  component={Link}
                  to={`/project/${project.id}`}
                  className={`menu-item ${isActive(`/project/${project.id}`)}`}
                >
                  <ListItemIcon className="menu-icon">
                    <Tooltip title={project.title} placement="right">
                      <Avatar
                        sx={{
                          bgcolor: getProjectColor(project.title),
                          width: 24,
                          height: 24,
                        }}
                      >
                        <FolderIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </Tooltip>
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {project.title}
                        </Typography>
                      }
                      primaryTypographyProps={{ component: 'span' }}
                    />
                  )}
                </ListItem>
              ))
            ) : (
              !collapsed && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 2, py: 1 }}
                >
                  Aucun projet récent
                </Typography>
              )
            )}
          </List>
        </>
      )}

      <div className="footer-sidebar">
        <IconButton
          onClick={handleLogout}
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <FaSignOutAlt />
        </IconButton>
      </div>
    </Drawer>
  );
};

export default Sidebar;