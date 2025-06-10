import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, logoutUser, fetchCurrentUser } from '../store/slices/authSlice';
import { fetchRoles } from '../store/slices/rolesSlice'; 
import LoadingPage from '../pages/LoadingPage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérifier l'authentification et charger les rôles
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await Promise.all([
          dispatch(fetchCurrentUser()),
          dispatch(fetchRoles()), 
        ]);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification ou des rôles:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [dispatch]);

  const handleLogin = async (userData) => {
    const response = await dispatch(login(userData));
    if (login.fulfilled.match(response)) {
      const role = response.payload.user.role;
      const redirectPath =
        role === 'SuperAdmin' ? '/SuperAdminStatistics' :
        role === 'Admin' ? '/UserStatisticsDashboard' :
        role === 'ChefProjet' ? '/dashboard' : '/profile';
      navigate(redirectPath);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const hasRole = (requiredRoles) => {
    if (!currentUser) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(currentUser.role);
    }
    return currentUser.role === requiredRoles;
  };

  const value = {
    currentUser,
    login: handleLogin,
    logout: handleLogout,
    hasRole,
    isAuthenticated,
    isInitialized,
  };

  // Ne rendre les enfants que lorsque l'authentification a été vérifiée
  if (!isInitialized) {
    return <LoadingPage />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);