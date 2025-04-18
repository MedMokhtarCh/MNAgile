import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const ActivityTrendChart = ({ data }) => {
  const activityTrendData = {
    labels: data.labels || [],
    datasets: [
      {
        label: 'Utilisateurs actifs',
        data: data.activeData || [],
        backgroundColor: '#86efac',
      },
      {
        label: 'Utilisateurs inactifs',
        data: data.inactiveData || [],
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

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom>
        Évolution du statut des utilisateurs
      </Typography>
      <Box sx={{ height: 300 }}>
        <Bar data={activityTrendData} options={activityTrendOptions} />
      </Box>
    </Paper>
  );
};

export default ActivityTrendChart;