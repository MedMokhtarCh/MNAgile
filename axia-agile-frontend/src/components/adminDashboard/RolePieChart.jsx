import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';

const RolePieChart = ({ usersByRole }) => {
  const pieData = {
    labels: usersByRole.map((role) => role.role),
    datasets: [
      {
        data: usersByRole.map((role) => role.count),
        backgroundColor: usersByRole.map((role) => role.color),
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

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom>
        Répartition par rôle
      </Typography>
      <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
        <Pie data={pieData} options={pieOptions} />
      </Box>
    </Paper>
  );
};

export default RolePieChart;