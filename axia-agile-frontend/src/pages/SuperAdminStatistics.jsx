import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers } from '../store/slices/usersSlice';
import PageTitle from '../components/common/PageTitle';
import StatisticsCards from '../components/superAdminDashboard/StatisticsCards';
import AdminDistributionChart from '../components/superAdminDashboard/AdminDistributionChart';
import SubscriptionStatsCards from '../components/superAdminDashboard/SubscriptionStatsCards';

const SuperAdminStatistics = () => {
  const dispatch = useDispatch();
  const { users, loading, error, lastCreateSuccess } = useSelector((state) => state.users);
  const { currentUser } = useAuth();

  // Fetch users on mount and when lastCreateSuccess changes
  useEffect(() => {
    if (currentUser) {
      console.log('[SuperAdminStatistics] Dispatching fetchUsers with currentUser:', currentUser);
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser, lastCreateSuccess]);

  const stats = useMemo(() => {
    if (!currentUser || loading || !Array.isArray(users)) {
      console.log('[SuperAdminStatistics] Skipping stats calculation due to no currentUser, loading, or invalid users');
      return null;
    }

    console.log('[SuperAdminStatistics] Calculating stats with users:', users);
    // Filter admins by roleId === 2 and valid email
    const admins = users.filter(
      (user) => user && user.roleId === 2 && user.email
    );

    const { totalAdmins, activeAdmins } = admins.reduce(
      (acc, admin) => {
        acc.totalAdmins += 1;
        if (admin.isActive) acc.activeAdmins += 1;
        return acc;
      },
      { totalAdmins: 0, activeAdmins: 0 }
    );

    const inactiveAdmins = totalAdmins - activeAdmins;

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      totalEntreprises: new Set(admins.map(admin => (admin.entreprise || 'Non spécifié').trim().toLowerCase())).size,
    };
  }, [users, loading, currentUser]);

  console.log('[SuperAdminStatistics] Rendering with state:', {
    users,
    loading,
    error,
    stats,
  });

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography color="textSecondary">Veuillez vous connecter pour voir les statistiques.</Typography>
      </Box>
    );
  }

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography color="error">Erreur: {error}</Typography>
        <Button
          onClick={() => dispatch(fetchUsers())}
          variant="contained"
          sx={{ ml: 2 }}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Rapport Statistique des Abonnements Admin</PageTitle>
      <StatisticsCards stats={stats} />
      <AdminDistributionChart stats={stats} />
      <SubscriptionStatsCards users={users} />
    </Box>
  );
};

export default SuperAdminStatistics;