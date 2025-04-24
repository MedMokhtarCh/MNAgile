import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../store/slices/usersSlice';
import PageTitle from '../components/common/PageTitle';
import StatisticsCards from '../components/superAdminDashboard/StatisticsCards';
import AdminDistributionChart from '../components/superAdminDashboard/AdminDistributionChart';
import EnterpriseList from '../components/superAdminDashboard/EnterpriseList';

const SuperAdminStatistics = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Compute stats and entrepriseData
  const { stats, entrepriseData } = React.useMemo(() => {
    // Filter admins (roleId 2), exclude superadmin (roleId 1) and others
    const admins = users.filter((user) => user.roleId === 2);

    // Compute stats and group by entreprise in one pass
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
  }, [users]);

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Rapport Statistique des Comptes Admin</PageTitle>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
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
      ) : (
        <>
          {/* Cartes de statistiques */}
          <StatisticsCards stats={stats} />

          {/* Graphiques */}
          <AdminDistributionChart stats={stats} />

          {/* Liste des entreprises et de leurs admins */}
          <EnterpriseList entrepriseData={entrepriseData} />
        </>
      )}
    </Box>
  );
};

export default SuperAdminStatistics;