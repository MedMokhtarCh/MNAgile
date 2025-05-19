import React, { useEffect, useMemo } from 'react';
import { Box, Grid, CircularProgress, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersByCreatedById } from '../store/slices/usersSlice';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/common/PageTitle';
import SummaryCards from '../components/adminDashboard/SummaryCards';
import StatusDoughnutChart from '../components/adminDashboard/StatusDoughnutChart';
import CreationTrendChart from '../components/adminDashboard/CreationTrendChart';
import ActivityTrendChart from '../components/adminDashboard/ActivityTrendChart';
import JobTitleDistribution from '../components/adminDashboard/JobTitleDistribution';
import RecentUsersList from '../components/adminDashboard/RecentUsersList';
import RolePieChart from '../components/adminDashboard/RolePieChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  DoughnutController,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  DoughnutController
);

// Role configuration for roleId 3 and 4
const ROLE_CONFIG = {
  3: { label: 'Chefs de projet', icon: 'ChefProjetIcon', color: '#86efac' },
  4: { label: 'Utilisateurs', icon: 'UserIcon', color: '#93c5fd' },
};

const UserStatisticsDashboard = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      console.log('[UserStatisticsDashboard] Current user:', currentUser);
      dispatch(fetchUsersByCreatedById(currentUser.id));
    }
  }, [dispatch, currentUser]);

  const userStats = useMemo(() => {
    if (loading || !users || !currentUser) {
      console.log('[UserStatisticsDashboard] Skipping userStats calculation due to loading, no users, or no currentUser');
      return null;
    }

    console.log('[UserStatisticsDashboard] Calculating userStats with users:', users);
    // Filter users by roleId (3 or 4) AND createdById matching currentUser.id
    const relevantUsers = users.filter(
      (user) => (user.roleId === 3 || user.roleId === 4) && user.createdById === currentUser.id
    );
    const totalUsers = relevantUsers.length;
    const activeUsers = relevantUsers.filter((user) => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    const usersByRole = [
      {
        role: ROLE_CONFIG[4].label,
        count: relevantUsers.filter((user) => user.roleId === 4).length,
        icon: ROLE_CONFIG[4].icon,
        color: ROLE_CONFIG[4].color,
      },
      {
        role: ROLE_CONFIG[3].label,
        count: relevantUsers.filter((user) => user.roleId === 3).length,
        icon: ROLE_CONFIG[3].icon,
        color: ROLE_CONFIG[3].color,
      },
    ];

    const jobTitleCounts = relevantUsers.reduce((acc, user) => {
      const jobTitle = user.jobTitle || 'Non spécifié';
      acc[jobTitle] = (acc[jobTitle] || 0) + 1;
      return acc;
    }, {});

    const jobTitleColors = [
      '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fbbf24',
      '#f472b6', '#38bdf8', '#fb923c', '#a3e635', '#e879f9',
    ];

    const usersByJobTitle = Object.entries(jobTitleCounts).map(([jobTitle, count], index) => ({
      jobTitle,
      count,
      color: jobTitleColors[index % jobTitleColors.length],
      icon: 'JobTitleIcon',
    }));

    const recentUsers = [...relevantUsers]
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
      .slice(0, 5)
      .map((user) => ({
        ...user,
        prenom: user.firstName,
        nom: user.lastName,
        role: user.roleId === 3 ? 'chef_projet' : 'user',
      }));

    const currentDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    const monthNames = last6Months.map((date) =>
      date.toLocaleDateString('fr-FR', { month: 'short' })
    );

    const usersByMonth = monthNames.reduce((acc, month) => {
      acc[month] = { user: 0, chef_projet: 0 };
      return acc;
    }, {});

    relevantUsers.forEach((user) => {
      const creationDate = new Date(user.dateCreated);
      const monthKey = creationDate.toLocaleDateString('fr-FR', { month: 'short' });
      if (monthNames.includes(monthKey)) {
        if (user.roleId === 3) {
          usersByMonth[monthKey].chef_projet += 1;
        } else if (user.roleId === 4) {
          usersByMonth[monthKey].user += 1;
        }
      }
    });

    const userCreationTrend = {
      labels: monthNames,
      datasets: [
        {
          label: 'Utilisateurs',
          data: monthNames.map((month) => usersByMonth[month].user),
          backgroundColor: '#93c5fd',
        },
        {
          label: 'Chefs de projet',
          data: monthNames.map((month) => usersByMonth[month].chef_projet),
          backgroundColor: '#86efac',
        },
      ],
    };

    const activityLogs = [];
    relevantUsers.forEach((user) => {
      const creationDate = new Date(user.dateCreated);
      activityLogs.push({
        userId: user.id,
        date: creationDate,
        isActive: true,
      });

      if (!user.isActive) {
        const deactivationDate = new Date(creationDate);
        const maxDays = Math.max(1, Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24)));
        const randomDays = Math.floor(Math.random() * maxDays) + 1;
        deactivationDate.setDate(deactivationDate.getDate() + randomDays);
        activityLogs.push({
          userId: user.id,
          date: deactivationDate,
          isActive: false,
        });
      }
    });

    activityLogs.sort((a, b) => a.date - b.date);

    const userStatusByMonth = monthNames.reduce((acc, month) => {
      acc[month] = { active: 0, inactive: 0, total: 0 };
      return acc;
    }, {});

    let currentUserStatus = {};
    activityLogs.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= last6Months[0] && logDate <= currentDate) {
        currentUserStatus[log.userId] = log.isActive;
        const logMonthIndex = last6Months.findIndex(
          (month) =>
            month.getMonth() === logDate.getMonth() &&
            month.getFullYear() === logDate.getFullYear()
        );
        if (logMonthIndex >= 0) {
          for (let i = logMonthIndex; i < last6Months.length; i++) {
            const monthKey = last6Months[i].toLocaleDateString('fr-FR', { month: 'short' });
            userStatusByMonth[monthKey] = { active: 0, inactive: 0, total: 0 };
            Object.values(currentUserStatus).forEach((isActive) => {
              if (isActive) {
                userStatusByMonth[monthKey].active++;
              } else {
                userStatusByMonth[monthKey].inactive++;
              }
              userStatusByMonth[monthKey].total++;
            });
          }
        }
      }
    });

    const userActivityStats = {
      labels: monthNames,
      activeData: monthNames.map((month) => userStatusByMonth[month]?.active || 0),
      inactiveData: monthNames.map((month) => userStatusByMonth[month]?.inactive || 0),
    };

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      usersByJobTitle,
      recentUsers,
      userCreationTrend,
      userActivityStats,
    };
  }, [users, loading, currentUser]);

  console.log('[UserStatisticsDashboard] Rendering with state:', { users, loading, error, userStats });

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography color="textSecondary">Veuillez vous connecter pour voir les statistiques.</Typography>
      </Box>
    );
  }

  if (loading || !userStats) {
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
    <Box sx={{ p: 4 }}>
      <PageTitle>Tableau de Bord Admin</PageTitle>

      {/* Section des cartes de résumé */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <SummaryCards
            totalUsers={userStats.totalUsers}
            activeUsers={userStats.activeUsers}
            inactiveUsers={userStats.inactiveUsers}
            usersByRole={userStats.usersByRole}
          />
        </Grid>
      </Grid>

      {/* Section des graphiques principaux */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Première ligne - Graphiques circulaires */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <RolePieChart
              usersByRole={userStats.usersByRole}
              sx={{ flex: 1, minHeight: '300px' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <StatusDoughnutChart
              activeUsers={userStats.activeUsers}
              inactiveUsers={userStats.inactiveUsers}
              sx={{ flex: 1, minHeight: '300px' }}
            />
          </Box>
        </Grid>

        {/* Deuxième ligne - Graphiques de tendances */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '400px' }}>
            <CreationTrendChart
              data={userStats.userCreationTrend}
              sx={{ height: '100%' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '400px' }}>
            <ActivityTrendChart
              data={userStats.userActivityStats}
              sx={{ height: '100%' }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Section des graphiques secondaires */}
      <Box sx={{
        mt: 6,
        mb: 8,
        position: 'relative',
        top: '20px'
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Box sx={{
              height: '500px',
               width:'1000px',
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 2,
            }}>
         
              <JobTitleDistribution
                usersByJobTitle={userStats.usersByJobTitle}
                totalUsers={userStats.totalUsers}
              />
            </Box>
               <Box sx={{
        mt: 6,
        mb: 8,
        position: 'relative',
        top: '20px'
      }}></Box>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Box sx={{
              height: '600px',
              width:'1000px',
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 2,
            }}>
              <RecentUsersList recentUsers={userStats.recentUsers} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default UserStatisticsDashboard;