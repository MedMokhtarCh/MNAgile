import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const mapRoleIdToRole = (roleId) => {
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
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const role = currentUser ? mapRoleIdToRole(currentUser.roleId) : null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};