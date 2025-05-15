import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import LoadingPage from '../pages/LoadingPage';




export const mapRoleIdToRole = (roleId) => {
  switch (roleId) {
    case 1:
      return 'superadmin';
    case 2:
      return 'admin';
    case 3:
      return 'chef_projet';
    case 4:
      return 'user';
    default:
      return null;
  }
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized, loading } = useAuth();
  console.log(isAuthenticated)
  const location = useLocation();

  if (!isInitialized || loading) {
    return <LoadingPage />; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children ? children : <Outlet />;
};

export const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, currentUser, isInitialized, loading } = useAuth();
  const location = useLocation();
  const role = currentUser ? mapRoleIdToRole(currentUser.roleId) : null;
  console.log(role)
  console.log(isAuthenticated)

  if (!isInitialized || loading) {
    return <LoadingPage />; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    console.log("here");
    
    return <Navigate to="/NotFound" replace />;
  }

  return children ? children : <Outlet />;
};