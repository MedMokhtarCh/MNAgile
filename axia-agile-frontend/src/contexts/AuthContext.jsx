import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, logout } from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérifier l'authentification au chargement initial
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('currentUser');
      
      if (token && user) {
        // Dispatch l'action de connexion avec les données stockées
        const userData = JSON.parse(user);
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            token,
            user: userData
          }
        });
      }
      setIsInitialized(true);
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
        role === 'ChefProjet' ? '/dashboard' : '/projects';
      navigate(redirectPath);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
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
    isInitialized
  };

  // Ne rendre les enfants que lorsque l'authentification a été vérifiée
  if (!isInitialized) {
    return <div>Chargement...</div>; // Ou un composant de chargement
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);