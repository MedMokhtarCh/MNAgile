import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Subscriptions as SubscriptionsIcon } from '@mui/icons-material';

const SubscriptionStatsCards = ({ users }) => {
  // Define plan colors to match SuperAdminSubscriptionManagement
  const planColors = {
    annual: { name: 'Annuel', count: 0, color: '#C8E6C9' }, // Pastel green
    semiannual: { name: 'Semestriel', count: 0, color: '#D1C4E9' }, // Pastel purple
    quarterly: { name: 'Trimestriel', count: 0, color: '#F8BBD0' }, // Pastel pink
    monthly: { name: 'Mensuel', count: 0, color: '#FFF9C4' }, // Pastel yellow
  };

  // Calculate admin counts by subscription plan and status
  const { planCounts, statusCounts } = React.useMemo(() => {
    if (!Array.isArray(users)) {
      return { planCounts: { ...planColors }, statusCounts: {} };
    }

    const planCounts = { ...planColors };

    const statusCounts = {
      Pending: { name: 'En attente', count: 0, gradient: 'linear-gradient(135deg, #FFCC80 0%, #FFB300 100%)' }, // Pastel orange
      Validated: { name: 'Validé', count: 0, gradient: 'linear-gradient(135deg, #80CBC4 0%, #4DB6AC 100%)' }, // Pastel teal
      Expired: { name: 'Expiré', count: 0, gradient: 'linear-gradient(135deg, #EF9A9A 0%, #E57373 100%)' }, // Pastel red
    };

    // Count admins by plan and status
    users
      .filter((user) => user && user.roleId === 2 && user.email && user.subscription)
      .forEach((admin) => {
        const planKey = (admin.subscription.plan || '').toLowerCase();
        const statusKey = admin.subscription.status || 'Pending';

        if (planCounts[planKey]) {
          planCounts[planKey].count += 1;
        }

        if (statusCounts[statusKey]) {
          statusCounts[statusKey].count += 1;
        }
      });

    return { planCounts, statusCounts };
  }, [users]);

  return (
    <Box sx={{ mt: 4 }}>
      {/* Subscription Plans Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Répartition des admins par abonnement
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Object.values(planCounts).map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan.name}>
            <Card
              sx={{
                background: plan.color, // Use solid color instead of gradient
                color: '#000', // Black text for better contrast on pastel backgrounds
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
                  {plan.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Subscription Status Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Répartition des admins par statut d'abonnement
      </Typography>
      <Grid container spacing={2}>
        {Object.values(statusCounts).map((status) => (
          <Grid item xs={12} sm={6} md={4} key={status.name}>
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
                  {status.name}
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