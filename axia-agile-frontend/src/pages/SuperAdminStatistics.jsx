import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsersByCreatedById } from '../store/slices/usersSlice';
import PageTitle from '../components/common/PageTitle';
import StatisticsCards from '../components/superAdminDashboard/StatisticsCards';
import AdminDistributionChart from '../components/superAdminDashboard/AdminDistributionChart';
import EnterpriseList from '../components/superAdminDashboard/EnterpriseList';

const SuperAdminStatistics = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      console.log('[SuperAdminStatistics] Dispatching fetchUsersByCreatedById with currentUser:', currentUser);
      dispatch(fetchUsersByCreatedById(currentUser.id));
    }
  }, [dispatch, currentUser]);

  const { stats, entrepriseData } = React.useMemo(() => {
    if (!currentUser || loading || !users) {
      console.log('[SuperAdminStatistics] Skipping stats calculation due to no currentUser, loading, or no users');
      return { stats: null, entrepriseData: [] };
    }

    console.log('[SuperAdminStatistics] Calculating stats and entrepriseData with users:', users);
    // Filter admins by roleId === 2 and createdById === currentUser.id
    const admins = users.filter((user) => user.roleId === 2 && user.createdById === currentUser.id);

    const { totalAdmins, activeAdmins, entrepriseMap } = admins.reduce(
      (acc, admin) => {
        acc.totalAdmins += 1;
        if (admin.isActive) acc.activeAdmins += 1;
        const entrepriseName = admin.entreprise || 'Non spécifié';
        if (!acc.entrepriseMap.has(entrepriseName)) {
          acc.entrepriseMap.set(entrepriseName, {
            name: entrepriseName,
            adminCount: 1,
            activeCount: admin.isActive ? 1 : 0,
            admins: [admin],
          });
        } else {
          const data = acc.entrepriseMap.get(entrepriseName);
          data.adminCount += 1;
          data.activeCount += admin.isActive ? 1 : 0;
          data.admins.push(admin);
          acc.entrepriseMap.set(entrepriseName, data);
        }
        return acc;
      },
      { totalAdmins: 0, activeAdmins: 0, entrepriseMap: new Map() }
    );

    const inactiveAdmins = totalAdmins - activeAdmins;
    const entrepriseArray = Array.from(entrepriseMap.values()).sort((a, b) => b.adminCount - a.adminCount);

    return {
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        totalEntreprises: entrepriseMap.size,
      },
      entrepriseData: entrepriseArray,
    };
  }, [users, loading, currentUser]);

  console.log('[SuperAdminStatistics] Rendering with state:', { users, loading, error, stats, entrepriseData });

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
          onClick={() => dispatch(fetchUsersByCreatedById(currentUser?.id))}
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
      <PageTitle>Rapport Statistique des Comptes Admin</PageTitle>
      <StatisticsCards stats={stats} />
      <AdminDistributionChart stats={stats} />
      <EnterpriseList entrepriseData={entrepriseData} />
    </Box>
  );
};

export default SuperAdminStatistics;