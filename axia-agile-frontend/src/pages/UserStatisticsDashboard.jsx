import React, { useEffect, useMemo } from 'react';
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../store/slices/usersSlice';
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

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const userStats = useMemo(() => {
    // Only count users with roleId 3 (Chefs de projet) or 4 (Utilisateurs)
    const relevantUsers = users.filter((user) => user.roleId === 3 || user.roleId === 4);
    const totalUsers = relevantUsers.length;
    const activeUsers = relevantUsers.filter((user) => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    // usersByRole for Chefs de projet and Utilisateurs
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

    // Users by job title
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

    // Recent users
    const recentUsers = [...relevantUsers]
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
      .slice(0, 5)
      .map((user) => ({
        ...user,
        prenom: user.firstName,
        nom: user.lastName,
        role: user.roleId === 3 ? 'chef_projet' : 'user',
      }));

    // Chart data
    const currentDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    const monthNames = last6Months.map((date) =>
      date.toLocaleDateString('fr-FR', { month: 'short' })
    );

    // User creation trend
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

    // User activity stats (simulated)
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
  }, [users]);

  return (
    <Box sx={{ p: 4 }}>
      <PageTitle>Tableau de Bord Admin</PageTitle>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Typography color="error">Erreur: {error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SummaryCards
              totalUsers={userStats.totalUsers}
              activeUsers={userStats.activeUsers}
              inactiveUsers={userStats.inactiveUsers}
              usersByRole={userStats.usersByRole}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <RolePieChart usersByRole={userStats.usersByRole} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatusDoughnutChart
              activeUsers={userStats.activeUsers}
              inactiveUsers={userStats.inactiveUsers}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CreationTrendChart data={userStats.userCreationTrend} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ActivityTrendChart data={userStats.userActivityStats} />
          </Grid>
          <Grid item xs={12}>
            <JobTitleDistribution
              usersByJobTitle={userStats.usersByJobTitle}
              totalUsers={userStats.totalUsers}
            />
          </Grid>
          <Grid item xs={12}>
            <RecentUsersList recentUsers={userStats.recentUsers} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserStatisticsDashboard;