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
} from '@mui/material';
import { FaChartBar, FaUsers, FaSignOutAlt, FaShieldAlt, FaKey, FaProjectDiagram, FaRegCommentDots, FaCreditCard } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import logo from '../../assets/logo.png';
import './Sidebar.css';
import { mapRoleIdToRole } from '../../utils/roles';

const AdminSidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  const role = currentUser ? mapRoleIdToRole(currentUser.roleId) : null;

  const projectClaims = [
    'CanViewProjects',
    'CanAddProjects',
    'CanEditProjects',
    'CanDeleteProjects',
  ];
  const hasProjectClaims = currentUser?.claims?.some((claim) =>
    projectClaims.includes(claim)
  );

  const userManagementClaims = [
    'CanViewUsers',
    'CanCreateUsers',
    'CanUpdateUsers',
    'CanDeleteUsers',
  ];
  const hasUserManagementClaims = currentUser?.claims?.some((claim) =>
    userManagementClaims.includes(claim)
  );

  const discussionClaims = ['CanCommunicate', 'CanCreateChannel'];
  const hasDiscussionClaims = currentUser?.claims?.some((claim) =>
    discussionClaims.includes(claim)
  );

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

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
      <div className="logo-container">
        <img
          src={logo}
          alt="Axia Agile"
          className={`logo ${collapsed ? 'collapsed-logo' : ''}`}
        />
      </div>

      <List>
        {/* Role-based routes for superadmin */}
        {role === 'superadmin' && (
          <>
            <ListItem
              button
              component={Link}
              to="/SuperAdminStatistics"
              className={`menu-item ${isActive('/SuperAdminStatistics')}`}
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
              to="/SuperAdminSubscriptionManagement"
              className={`menu-item ${isActive('/SuperAdminSubscriptionManagement')}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Abonnements" placement="right">
                  <FaCreditCard />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Abonnements" />}
            </ListItem>
                       <ListItem
              button
              component={Link}
              to="/AdminManagement"
              className={`menu-item ${isActive('/AdminManagement')}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Admins" placement="right">
               <FaUsers />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Admins" />}
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/RoleManagement"
              className={`menu-item ${isActive('/RoleManagement')}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Rôles" placement="right">
                  <FaShieldAlt />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Rôles" />}
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/ClaimManagement"
              className={`menu-item ${isActive('/ClaimManagement')}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Droits d'accès" placement="right">
                  <FaKey />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Droits d'accès" />}
            </ListItem>
          </>
        )}

        {/* Role-based routes for admin */}
        {role === 'admin' && (
          <>
            <ListItem
              button
              component={Link}
              to="/UserStatisticsDashboard"
              className={`menu-item ${isActive('/UserStatisticsDashboard')}`}
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
              to="/RoleManagement"
              className={`menu-item ${isActive('/RoleManagement')}`}
            >
              <ListItemIcon className="menu-icon">
                <Tooltip title="Rôles" placement="right">
                  <FaShieldAlt />
                </Tooltip>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Rôles" />}
            </ListItem>
        
            
          </>
        )}

        {/* Claims-based routes */}
        {hasUserManagementClaims && (
          <ListItem
            button
            component={Link}
            to="/UserManagement"
            className={`menu-item ${isActive('/UserManagement')}`}
          >
            <ListItemIcon className="menu-icon">
              <Tooltip title="Utilisateurs" placement="right">
                <FaUsers />
              </Tooltip>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Utilisateurs" />}
          </ListItem>
        )}

        {hasProjectClaims && (
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
            {!collapsed && <ListItemText primary="Projets" />}
          </ListItem>
        )}

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
            {!collapsed && <ListItemText primary="Messages" />}
          </ListItem>
        )}
      </List>

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
          <Tooltip title="Déconnexion" placement="right">
            <FaSignOutAlt />
          </Tooltip>
        </IconButton>
      </div>
    </Drawer>
  );
};

export default AdminSidebar;