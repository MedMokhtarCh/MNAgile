import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';

const StatusDoughnutChart = ({ activeUsers, inactiveUsers }) => {
  const activityData = {
    labels: ['Actifs', 'Inactifs'],
    datasets: [
      {
        data: [activeUsers, inactiveUsers],
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

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom>
        Statut des utilisateurs
      </Typography>
      <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
        <Doughnut data={activityData} options={activityOptions} />
      </Box>
    </Paper>
  );
};

export default StatusDoughnutChart;