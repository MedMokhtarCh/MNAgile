import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Subscriptions as SubscriptionsIcon } from '@mui/icons-material';

const SubscriptionStatsCards = ({ users }) => {
  // Define plan colors (keeping your original color scheme)
  const planColors = {
    annual: { name: 'Annuel', count: 0, color: '#C8E6C9' }, // Pastel green
    semiannual: { name: 'Semestriel', count: 0, color: '#D1C4E9' }, // Pastel purple
    quarterly: { name: 'Trimestriel', count: 0, color: '#F8BBD0' }, // Pastel pink
    monthly: { name: 'Mensuel', count: 0, color: '#FFF9C4' } // Pastel yellow
  };

  // Status colors with your gradient style
  const statusColors = {
    Active: { name: 'Validé', count: 0, gradient: 'linear-gradient(135deg, #80CBC4 0%, #4DB6AC 100%)' }, // Pastel teal
    Pending: { name: 'En attente', count: 0, gradient: 'linear-gradient(135deg, #FFCC80 0%, #FFB300 100%)' }, // Pastel orange
    Expired: { name: 'Expiré', count: 0, gradient: 'linear-gradient(135deg, #EF9A9A 0%, #E57373 100%)' } // Pastel red
  };

  // Calculate counts (using the improved logic)
  const { planCounts, statusCounts, totalAdmins } = React.useMemo(() => {
    const admins = users?.filter(user => user && user.roleId === 2 && user.email) || [];
    const totalAdmins = admins.length;

    const planCounts = { ...planColors };
    const statusCounts = { ...statusColors };

    admins.forEach((admin) => {
      const hasSubscription = admin.subscription;
      const planKey = hasSubscription ? (admin.subscription.plan || '').toLowerCase() : null;
      const statusKey = hasSubscription ? (admin.subscription.status || 'Pending') : null;

      if (planKey && planCounts[planKey]) {
        planCounts[planKey].count += 1;
      }

      if (statusKey && statusCounts[statusKey]) {
        statusCounts[statusKey].count += 1;
      }
    });

    return { planCounts, statusCounts, totalAdmins };
  }, [users]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Répartition des abonnements par plan
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Object.entries(planCounts).map(([key, plan]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              sx={{
                background: plan.color, 
                color: '#000', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                height: 120,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <SubscriptionsIcon sx={{ fontSize: 24, mr: 1 }} />
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {plan.count}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  {plan.name} ({totalAdmins > 0 ? ((plan.count / totalAdmins) * 100).toFixed(1) : 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Répartition des abonnements par statut
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(statusCounts).map(([key, status]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card
              sx={{
                background: status.gradient,
                color: 'white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                height: 120,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <SubscriptionsIcon sx={{ fontSize: 24, mr: 1 }} />
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {status.count}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                  {status.name} ({totalAdmins > 0 ? ((status.count / totalAdmins) * 100).toFixed(1) : 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SubscriptionStatsCards;