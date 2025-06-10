import React, { useRef } from 'react';
import { Paper, Typography, Divider, Grid, Box } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const AdminDistributionChart = ({ stats }) => {
  const chartRef = useRef();
  
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
  );
};

export default AdminDistributionChart;