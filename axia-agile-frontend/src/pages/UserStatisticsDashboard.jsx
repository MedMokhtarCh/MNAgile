import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Person as UserIcon,
  SupervisorAccount as ChefProjetIcon,
  PeopleAlt as TotalUsersIcon,
  Today as RecentIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Work as JobTitleIcon,
} from '@mui/icons-material';
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
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
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
    userCreationTrend: [],
    userActivityStats: {},
  });

  useEffect(() => {
    // Simulate fetching data from localStorage
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
          icon: <UserIcon />,
          color: '#93c5fd',
        },
        {
          role: 'Chefs de projet',
          count: storedUsers.filter((user) => user.role === 'chef_projet').length,
          icon: <ChefProjetIcon />,
          color: '#86efac',
        },
      ];

      // Users by job title
      const uniqueJobTitles = [...new Set(storedUsers.filter((user) => user.jobTitle).map((user) => user.jobTitle))];
      const jobTitleColors = [
        '#60a5fa',
        '#34d399',
        '#a78bfa',
        '#f87171',
        '#fbbf24',
        '#f472b6',
        '#38bdf8',
        '#fb923c',
        '#a3e635',
        '#e879f9',
      ];
      const usersByJobTitle = uniqueJobTitles.map((jobTitle, index) => ({
        jobTitle: jobTitle || 'Non spécifié',
        count: storedUsers.filter((user) => user.jobTitle === jobTitle).length,
        color: jobTitleColors[index % jobTitleColors.length],
        icon: <JobTitleIcon />,
      }));

      // Add users with no job title
      const noJobTitleCount = storedUsers.filter((user) => !user.jobTitle).length;
      if (noJobTitleCount > 0) {
        usersByJobTitle.push({
          jobTitle: 'Non spécifié',
          count: noJobTitleCount,
          color: '#9ca3af',
          icon: <JobTitleIcon />,
        });
      }

      // Recent users
      const recentUsers = [...storedUsers]
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        .slice(0, 5);

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

      // User activity logs
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

      // Update state
      setUserStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        usersByJobTitle,
        recentUsers,
        userCreationTrend,
        userActivityStats,
      });
      setLoading(false);
    }, 1000);
  }, []);

  // Chart options and data
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: "Création d'utilisateurs sur les 6 derniers mois",
      },
    },
  };

  const pieData = {
    labels: userStats.usersByRole.map((role) => role.role),
    datasets: [
      {
        data: userStats.usersByRole.map((role) => role.count),
        backgroundColor: userStats.usersByRole.map((role) => role.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Répartition par rôle',
      },
    },
  };

  const activityData = {
    labels: ['Actifs', 'Inactifs'],
    datasets: [
      {
        data: [userStats.activeUsers, userStats.inactiveUsers],
        backgroundColor: ['#86efac', '#fca5a5'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const activityOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Statut des utilisateurs',
      },
    },
    cutout: '60%',
  };

  const activityTrendData = {
    labels: userStats.userActivityStats.labels || [],
    datasets: [
      {
        label: 'Utilisateurs actifs',
        data: userStats.userActivityStats.activeData || [],
        backgroundColor: '#86efac',
      },
      {
        label: 'Utilisateurs inactifs',
        data: userStats.userActivityStats.inactiveData || [],
        backgroundColor: '#fca5a5',
      },
    ],
  };

  const activityTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution du statut des utilisateurs',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  const jobTitleData = {
    labels: userStats.usersByJobTitle.map((item) => item.jobTitle),
    datasets: [
      {
        data: userStats.usersByJobTitle.map((item) => item.count),
        backgroundColor: userStats.usersByJobTitle.map((item) => item.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const jobTitleOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: {
            size: 10,
          },
        },
      },
      title: {
        display: true,
        text: 'Répartition par titre de poste',
      },
    },
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de Bord des Utilisateurs
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Cards for total users, active users, inactive users, etc. */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#e0f2fe', mr: 1, width: 32, height: 32 }}>
                        <TotalUsersIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="subtitle1">Total</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {userStats.totalUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#dcfce7', mr: 1, width: 32, height: 32 }}>
                        <ActiveIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="subtitle1">Actifs</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
                      {userStats.activeUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {userStats.totalUsers > 0
                        ? `${Math.round((userStats.activeUsers / userStats.totalUsers) * 100)}% du total`
                        : '0% du total'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#fee2e2', mr: 1, width: 32, height: 32 }}>
                        <InactiveIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="subtitle1">Inactifs</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                      {userStats.inactiveUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {userStats.totalUsers > 0
                        ? `${Math.round((userStats.inactiveUsers / userStats.totalUsers) * 100)}% du total`
                        : '0% du total'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {userStats.usersByRole.map((role, index) => (
                <Grid item xs={6} sm={4} md={2.4} key={index}>
                  <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: `${role.color}33`, mr: 1, width: 32, height: 32 }}>
                          {React.cloneElement(role.icon, { sx: { color: role.color.replace('fd', '82').replace('ac', '81'), fontSize: 20 } })}
                        </Avatar>
                        <Typography variant="subtitle1">{role.role}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: role.color.replace('fd', '82').replace('ac', '81') }}>
                        {role.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {userStats.totalUsers > 0
                          ? `${Math.round((role.count / userStats.totalUsers) * 100)}% du total`
                          : '0% du total'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts and other components */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Répartition par rôle
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Pie data={pieData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statut des utilisateurs
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={activityData} options={activityOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tendance de création d'utilisateurs
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={userStats.userCreationTrend} options={barOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Évolution du statut des utilisateurs
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={activityTrendData} options={activityTrendOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <JobTitleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Répartition par titre de poste</Typography>
              </Box>
              {userStats.usersByJobTitle.length > 0 ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                      <Pie data={jobTitleData} options={jobTitleOptions} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List>
                      {userStats.usersByJobTitle.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: `${item.color}33` }}>
                                <JobTitleIcon sx={{ color: item.color }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2">{item.jobTitle}</Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {item.count} {item.count > 1 ? 'utilisateurs' : 'utilisateur'}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {userStats.totalUsers > 0
                                    ? `${Math.round((item.count / userStats.totalUsers) * 100)}% du total des utilisateurs`
                                    : '0% du total'}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < userStats.usersByJobTitle.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucune donnée de titre de poste n'est disponible pour le moment.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RecentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Derniers utilisateurs créés</Typography>
              </Box>
              <List>
                {userStats.recentUsers.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: user.role === 'chef_projet' ? '#dcfce7' : '#e0f2fe',
                            color: user.role === 'chef_projet' ? '#16a34a' : '#3b82f6',
                          }}
                        >
                          {user.prenom ? user.prenom[0].toUpperCase() : user.email[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">
                              {`${user.prenom || ''} ${user.nom || ''}`}
                            </Typography>
                            <Box>
                              <Tooltip title={user.role === 'chef_projet' ? 'Chef de projet' : 'Utilisateur'}>
                                <span>
                                  {user.role === 'chef_projet' ? (
                                    <ChefProjetIcon sx={{ mr: 1, color: '#16a34a' }} />
                                  ) : (
                                    <UserIcon sx={{ mr: 1, color: '#3b82f6' }} />
                                  )}
                                </span>
                              </Tooltip>
                              <Chip
                                icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                                label={user.isActive ? 'Actif' : 'Inactif'}
                                size="small"
                                sx={{
                                  bgcolor: user.isActive ? '#dcfce7' : '#fee2e2',
                                  color: user.isActive ? '#16a34a' : '#dc2626',
                                  '& .MuiChip-icon': {
                                    color: user.isActive ? '#16a34a' : '#dc2626',
                                  },
                                }}
                              />
                              {user.jobTitle && (
                                <Chip
                                  icon={<JobTitleIcon />}
                                  label={user.jobTitle}
                                  size="small"
                                  sx={{
                                    ml: 1,
                                    bgcolor: '#f3f4f6',
                                    '& .MuiChip-icon': {
                                      color: '#6b7280',
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {user.email}
                            </Typography>
                            <Typography component="div" variant="body2">
                              {`Créé le ${formatDate(user.dateCreated)}`}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < userStats.recentUsers.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserStatisticsDashboard;