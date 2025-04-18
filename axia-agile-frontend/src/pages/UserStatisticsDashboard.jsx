import React, { useEffect, useState } from 'react';
import { Box, Grid, CircularProgress } from '@mui/material';
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

const UserStatisticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByRole: [],
    usersByJobTitle: [],
    recentUsers: [],
    userCreationTrend: {},
    userActivityStats: {},
  });

  useEffect(() => {
    
    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const totalUsers = storedUsers.length;
      const activeUsers = storedUsers.filter((user) => user.isActive === true).length;
      const inactiveUsers = totalUsers - activeUsers;

      // Users by role
      const usersByRole = [
        {
          role: 'Utilisateurs',
          count: storedUsers.filter((user) => user.role === 'user').length,
          icon: 'UserIcon',
          color: '#93c5fd',
        },
        {
          role: 'Chefs de projet',
          count: storedUsers.filter((user) => user.role === 'chef_projet').length,
          icon: 'ChefProjetIcon',
          color: '#86efac',
        },
      ];

      // Users by job title
      const uniqueJobTitles = [...new Set(storedUsers.filter((user) => user.jobTitle).map((user) => user.jobTitle))];
      const jobTitleColors = [
        '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fbbf24',
        '#f472b6', '#38bdf8', '#fb923c', '#a3e635', '#e879f9',
      ];
      
      const usersByJobTitle = uniqueJobTitles.map((jobTitle, index) => ({
        jobTitle: jobTitle || 'Non spécifié',
        count: storedUsers.filter((user) => user.jobTitle === jobTitle).length,
        color: jobTitleColors[index % jobTitleColors.length],
        icon: 'JobTitleIcon',
      }));

   
      const noJobTitleCount = storedUsers.filter((user) => !user.jobTitle).length;
      if (noJobTitleCount > 0) {
        usersByJobTitle.push({
          jobTitle: 'Non spécifié',
          count: noJobTitleCount,
          color: '#9ca3af',
          icon: 'JobTitleIcon',
        });
      }

      // Recent users
      const recentUsers = [...storedUsers]
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        .slice(0, 5);

      // Calculate data for charts
      const chartData = prepareChartData(storedUsers);

      // Update state
      setUserStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        usersByJobTitle,
        recentUsers,
        userCreationTrend: chartData.userCreationTrend,
        userActivityStats: chartData.userActivityStats,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const prepareChartData = (storedUsers) => {
    // User creation trend (last 6 months)
    const currentDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();
    
    const monthNames = last6Months.map((date) =>
      date.toLocaleDateString('fr-FR', { month: 'short' })
    );

    // User activity logs simulation
    let activityLogs = [];
    storedUsers.forEach((user) => {
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

    // Sort activity logs by date
    activityLogs.sort((a, b) => a.date - b.date);

    // Calculate user status by month
    const userStatusByMonth = {};
    last6Months.forEach((date) => {
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
      userStatusByMonth[monthKey] = { active: 0, inactive: 0, total: 0 };
    });

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

    // User activity stats
    const userActivityStats = {
      labels: monthNames,
      activeData: monthNames.map((month) => userStatusByMonth[month]?.active || 0),
      inactiveData: monthNames.map((month) => userStatusByMonth[month]?.inactive || 0),
    };

    // User creation trend
    const usersByMonth = {};
    monthNames.forEach((month) => {
      usersByMonth[month] = { user: 0, chef_projet: 0 };
    });
    
    storedUsers.forEach((user) => {
      const creationDate = new Date(user.dateCreated);
      const monthKey = creationDate.toLocaleDateString('fr-FR', { month: 'short' });
      if (monthNames.includes(monthKey)) {
        if (user.role === 'chef_projet') {
          usersByMonth[monthKey].chef_projet += 1;
        } else if (user.role === 'user') {
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

    return { userCreationTrend, userActivityStats };
  };

  return (
    <Box sx={{ p: 4 }}>
      <PageTitle>Tableau de Bord Admin</PageTitle>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <SummaryCards 
              totalUsers={userStats.totalUsers} 
              activeUsers={userStats.activeUsers} 
              inactiveUsers={userStats.inactiveUsers}
              usersByRole={userStats.usersByRole}
            />
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <RolePieChart usersByRole={userStats.usersByRole} />
          </Grid>

          <Grid item xs={12} md={6}>
            <StatusDoughnutChart activeUsers={userStats.activeUsers} inactiveUsers={userStats.inactiveUsers} />
          </Grid>

          <Grid item xs={12} md={6}>
            <CreationTrendChart data={userStats.userCreationTrend} />
          </Grid>

          <Grid item xs={12} md={6}>
            <ActivityTrendChart data={userStats.userActivityStats} />
          </Grid>

          {/* Job Title Distribution */}
          <Grid item xs={12}>
            <JobTitleDistribution usersByJobTitle={userStats.usersByJobTitle} totalUsers={userStats.totalUsers} />
          </Grid>

          {/* Recent Users List */}
          <Grid item xs={12}>
            <RecentUsersList recentUsers={userStats.recentUsers} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserStatisticsDashboard;