import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingPage from '../pages/LoadingPage';

// Supprimez la fonction mapRoleIdToRole car nous allons utiliser directement le nom du rôle
// depuis currentUser.roleName (ou un champ similaire dans votre modèle utilisateur)

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
  
  // Utilisez directement le nom du rôle depuis currentUser
  const role = currentUser?.roleName || null;

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
  const role = currentUser?.roleName || null;

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