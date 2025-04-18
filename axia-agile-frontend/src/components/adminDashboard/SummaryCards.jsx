import React from 'react';
import { Grid, Card, CardContent, Box, Avatar, Typography } from '@mui/material';
import {
  Person as UserIcon,
  SupervisorAccount as ChefProjetIcon,
  PeopleAlt as TotalUsersIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';

const SummaryCards = ({ totalUsers, activeUsers, inactiveUsers, usersByRole }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={4} md={2.4}>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: '#e0f2fe', mr: 1, width: 32, height: 32 }}>
                <TotalUsersIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1">Total</Typography>
            </Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {totalUsers}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} sm={4} md={2.4}>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: '#dcfce7', mr: 1, width: 32, height: 32 }}>
                <ActiveIcon sx={{ color: '#22c55e', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1">Actifs</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
              {activeUsers}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
              {totalUsers > 0
                ? `${Math.round((activeUsers / totalUsers) * 100)}% du total`
                : '0% du total'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} sm={4} md={2.4}>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: '#fee2e2', mr: 1, width: 32, height: 32 }}>
                <InactiveIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1">Inactifs</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
              {inactiveUsers}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
              {totalUsers > 0
                ? `${Math.round((inactiveUsers / totalUsers) * 100)}% du total`
                : '0% du total'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {usersByRole.map((role, index) => {
        // Déterminer l'icône à utiliser
        let RoleIcon = UserIcon;
        if (role.icon === 'ChefProjetIcon') RoleIcon = ChefProjetIcon;
        
        return (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: `${role.color}33`, mr: 1, width: 32, height: 32 }}>
                    <RoleIcon sx={{ color: role.color.replace('fd', '82').replace('ac', '81'), fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="subtitle1">{role.role}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: role.color.replace('fd', '82').replace('ac', '81') }}>
                  {role.count}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
                  {totalUsers > 0
                    ? `${Math.round((role.count / totalUsers) * 100)}% du total`
                    : '0% du total'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SummaryCards;