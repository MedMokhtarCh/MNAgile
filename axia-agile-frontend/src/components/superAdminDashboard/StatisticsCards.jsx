import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon 
} from '@mui/icons-material';

const StatisticsCards = ({ stats }) => {
  return (
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
  );
};

export default StatisticsCards;