import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Box,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

const PendingStats = ({ subscriptionsLoading, filteredPendingSubscriptions }) => {
  const getPlanLabel = (plan) => {
    const planStyles = {
      annual: {
        label: 'Annuel',
        color: '#C8E6C9',
        icon: <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      semiannual: {
        label: 'Semestriel',
        color: '#D1C4E9',
        icon: <EventIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      quarterly: {
        label: 'Trimestriel',
        color: '#F8BBD0',
        icon: <DateRangeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      monthly: {
        label: 'Mensuel',
        color: '#FFF9C4',
        icon: <TodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
    };

    const planKey = plan?.toLowerCase();
    return (
      planStyles[planKey] || {
        label: 'N/A',
        color: '#E0E0E0',
        icon: null,
      }
    );
  };

  const getPlanStatistics = () => {
    const planCounts = {
      annual: 0,
      semiannual: 0,
      quarterly: 0,
      monthly: 0,
    };

    filteredPendingSubscriptions.forEach((sub) => {
      const planKey = sub.plan?.toLowerCase();
      if (planCounts.hasOwnProperty(planKey)) {
        planCounts[planKey]++;
      }
    });

    return Object.entries(planCounts).map(([planKey, count]) => {
      const { label, color, icon } = getPlanLabel(planKey);
      return {
        planKey,
        label,
        color,
        icon,
        count,
      };
    });
  };

  const totalPendingSubscriptions = filteredPendingSubscriptions.length;
  const planStats = getPlanStatistics();

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={2.4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              height: 120,
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
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {subscriptionsLoading ? <CircularProgress size={24} color="inherit" /> : totalPendingSubscriptions}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                Total en Attente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {planStats.map(({ planKey, label, color, icon, count }) => (
          <Grid item xs={12} sm={2.4} key={planKey}>
            <Card
              sx={{
                height: 120,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: `1px solid ${color}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                    p: 1,
                    backgroundColor: color,
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    margin: '0 auto 8px auto',
                  }}
                >
                  {React.cloneElement(icon, { fontSize: 'small' })}
                </Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.primary' }}
                >
                  {subscriptionsLoading ? <CircularProgress size={20} /> : count}
                </Typography>
                <Chip
                  label={label}
                  size="small"
                  sx={{
                    backgroundColor: color,
                    color: '#000',
                    fontWeight: 'medium',
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PendingStats;