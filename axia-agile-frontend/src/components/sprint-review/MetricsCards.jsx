
import { Grid, Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { Timeline as TimelineIcon, TrendingUp as TrendingUpIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';

const MetricsCards = ({ metrics }) => {
  const metricsData = [
    {
      title: 'Tâches Totales',
      value: metrics.totalTasks,
      icon: <TimelineIcon />,
      color: 'primary',
      subtitle: `${metrics.totalCompleted} terminées`,
    },
    {
      title: 'Taux de Réussite',
      value: `${metrics.overallCompletionRate.toFixed(1)}%`,
      icon: <TrendingUpIcon />,
      color: 'success',
      subtitle: 'Projet global',
    },
    {
      title: 'Coût Total Projet',
      value: `${metrics.totalCost.toFixed(0)} DT`,
      icon: <AccountBalanceIcon />,
      color: 'warning',
      subtitle: 'Budget projet estimé',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {metricsData.map((metric, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${
                metric.color === 'primary' ? '#1976d2, #42a5f5' :
                metric.color === 'success' ? '#2e7d32, #66bb6a' :
                '#ed6c02, #ffb74d'
              })`,
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {metric.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {metric.subtitle}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  {metric.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCards;