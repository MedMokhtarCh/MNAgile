import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography, Divider, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Tooltip, Chip } from '@mui/material';
import { 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(ArcElement, ChartTooltip, Legend);

const AdminStatistics = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    totalEntreprises: 0
  });
  const [entrepriseData, setEntrepriseData] = useState([]);

  const chartRef = useRef();

  useEffect(() => {
    // Récupération des données du localStorage
    const admins = JSON.parse(localStorage.getItem('admins')) || [];
    
    // Calcul des statistiques
    const activeAdmins = admins.filter(admin => admin.isActive).length;
    
    // Groupement des admins par entreprise
    const entrepriseMap = new Map();
    
    admins.forEach(admin => {
      if (admin.entreprise) {
        if (!entrepriseMap.has(admin.entreprise)) {
          entrepriseMap.set(admin.entreprise, {
            name: admin.entreprise,
            adminCount: 1,
            activeCount: admin.isActive ? 1 : 0,
            admins: [admin]
          });
        } else {
          const data = entrepriseMap.get(admin.entreprise);
          data.adminCount += 1;
          data.activeCount += admin.isActive ? 1 : 0;
          data.admins.push(admin);
          entrepriseMap.set(admin.entreprise, data);
        }
      }
    });
    
    // Conversion en array pour l'affichage
    const entrepriseArray = Array.from(entrepriseMap.values());
    entrepriseArray.sort((a, b) => b.adminCount - a.adminCount);
    
    setStats({
      totalAdmins: admins.length,
      activeAdmins: activeAdmins,
      inactiveAdmins: admins.length - activeAdmins,
      totalEntreprises: entrepriseMap.size
    });
    
    setEntrepriseData(entrepriseArray);
  }, []);

  // Configuration du graphique Chart.js
  const chartData = {
    labels: ['Actifs', 'Inactifs'],
    datasets: [
      {
        data: [stats.activeAdmins, stats.inactiveAdmins],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 1,
        hoverOffset: 10
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = stats.totalAdmins > 0 
              ? Math.round((value / stats.totalAdmins) * 100) 
              : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '40%'
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Rapport Statistique des Comptes Admin
      </Typography>
      
      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 36, color: '#2563eb', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Admins
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#2563eb' }}>
                {stats.totalAdmins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10b981', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Admins Actifs
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#10b981' }}>
                {stats.activeAdmins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CancelIcon sx={{ fontSize: 36, color: '#ef4444', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Admins Inactifs
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#ef4444' }}>
                {stats.inactiveAdmins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon sx={{ fontSize: 36, color: '#f97316', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Entreprises
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#f97316' }}>
                {stats.totalEntreprises}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Graphiques */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Répartition des comptes admin</Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={4}>
            <Box sx={{ height: 300 }}>
              {(stats.activeAdmins > 0 || stats.inactiveAdmins > 0) ? (
                <Pie ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucune donnée disponible
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} lg={8}>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
                <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                  Analyse des Comptes Admin
                </Typography>
                {stats.totalAdmins > 0 ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {stats.activeAdmins > stats.inactiveAdmins ? (
                        `La majorité des comptes admin (${((stats.activeAdmins / stats.totalAdmins) * 100).toFixed(0)}%) sont actuellement actifs.`
                      ) : (
                        `Attention: ${((stats.inactiveAdmins / stats.totalAdmins) * 100).toFixed(0)}% des comptes admin sont inactifs.`
                      )}
                    </Typography>
                    <Typography variant="body1">
                      En moyenne, il y a {stats.totalEntreprises > 0 ? (stats.totalAdmins / stats.totalEntreprises).toFixed(1) : 0} comptes admin par entreprise.
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1">
                    Aucun compte admin n'a été créé pour le moment.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Liste des entreprises et de leurs admins */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Entreprises et Administrateurs</Typography>
        <Divider sx={{ mb: 3 }} />
        
        {entrepriseData.length > 0 ? (
          <Grid container spacing={3}>
            {entrepriseData.map((entreprise, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BusinessIcon sx={{ fontSize: 22, color: '#f97316', mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {entreprise.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                      <Chip 
                        size="small" 
                        label={`${entreprise.adminCount} admin${entreprise.adminCount > 1 ? 's' : ''}`} 
                        color="primary"
                      />
                      <Chip 
                        size="small" 
                        label={`${entreprise.activeCount} actif${entreprise.activeCount > 1 ? 's' : ''}`} 
                        color="success"
                      />
                      <Chip 
                        size="small" 
                        label={`${entreprise.adminCount - entreprise.activeCount} inactif${entreprise.adminCount - entreprise.activeCount > 1 ? 's' : ''}`} 
                        color={entreprise.adminCount - entreprise.activeCount > 0 ? "error" : "default"}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {entreprise.admins.map((admin, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: admin.isActive ? '#10b981' : '#d1d5db' }}>
                              {admin.email.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" noWrap>
                                  {admin.email}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {admin.isActive ? 'Actif' : 'Inactif'}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Aucune entreprise enregistrée
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminStatistics;