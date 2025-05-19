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

  if (!isInitialized || loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    console.log(`RoleProtectedRoute: Access denied. Role: ${role}, Allowed: ${allowedRoles}`);
    return <Navigate to="/NotFound" replace />;
  }

  return children ? children : <Outlet />;
};

export const ClaimProtectedRoute = ({ requiredClaims, children }) => {
  const { isAuthenticated, currentUser, isInitialized, loading } = useAuth();
  const location = useLocation();

  if (!isInitialized || loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredClaims = currentUser?.claims?.some((claim) =>
    requiredClaims.includes(claim)
  );

  if (!hasRequiredClaims) {
    console.log(`ClaimProtectedRoute: Access denied. Claims: ${currentUser?.claims}, Required: ${requiredClaims}`);
    return <Navigate to="/NotFound" replace />;
  }

  return children ? children : <Outlet />;
};

export const RoleOrClaimProtectedRoute = ({ allowedRoles, requiredClaims, children }) => {
  const { isAuthenticated, currentUser, isInitialized, loading } = useAuth();
  const location = useLocation();
  const role = currentUser ? mapRoleIdToRole(currentUser.roleId) : null;

  if (!isInitialized || loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredClaims = currentUser?.claims?.length > 0 && currentUser.claims.some((claim) =>
    requiredClaims.includes(claim)
  );
  const hasRequiredRole = role && allowedRoles.includes(role);

  console.log(`RoleOrClaimProtectedRoute: Path: ${location.pathname}, Role: ${role}, HasRole: ${hasRequiredRole}, Claims: ${currentUser?.claims}, HasClaims: ${hasRequiredClaims}`);

  if (!hasRequiredClaims && !hasRequiredRole) {
    console.log(`RoleOrClaimProtectedRoute: Access denied. Redirecting to /NotFound`);
    return <Navigate to="/NotFound" replace />;
  }

  return children ? children : <Outlet />;
};