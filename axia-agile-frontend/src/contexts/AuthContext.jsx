import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, logoutUser, fetchCurrentUser } from '../store/slices/authSlice';
import { fetchProfile, clearProfile } from '../store/slices/profileSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await dispatch(fetchCurrentUser()).unwrap();
        if (isAuthenticated) {
          await dispatch(fetchProfile()).unwrap();
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [dispatch, isAuthenticated]);

  const handleLogin = async (userData) => {
    try {
      const response = await dispatch(login(userData)).unwrap();
      // Fetch user and profile data immediately after login
      await dispatch(fetchCurrentUser()).unwrap();
      await dispatch(fetchProfile()).unwrap();
      const role = response.user.role;
      const redirectPath =
        role === 'SuperAdmin' ? '/SuperAdminStatistics' :
        role === 'Admin' ? '/UserStatisticsDashboard' :
        role === 'ChefProjet' ? '/dashboard' : '/projects';
      navigate(redirectPath);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearProfile()); // Ensure profile state is cleared
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
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

  if (!isInitialized) {
    return <div>Chargement...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);