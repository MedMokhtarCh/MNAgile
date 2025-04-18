import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const CreationTrendChart = ({ data }) => {
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

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tendance de création d'utilisateurs
      </Typography>
      <Box sx={{ height: 300 }}>
        <Bar data={data} options={barOptions} />
      </Box>
    </Paper>
  );
};

export default CreationTrendChart;