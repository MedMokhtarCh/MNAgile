import React from 'react';
import { 
  Paper, Typography, Divider, Grid, Card, CardContent, Box, List, 
  ListItem, ListItemText, ListItemAvatar, Avatar, Chip 
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const EnterpriseList = ({ entrepriseData }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Entreprises et Administrateurs</Typography>
      <Divider sx={{ mb: 3 }} />
      
      {entrepriseData.length > 0 ? (
        <Grid container spacing={3}>
          {entrepriseData.map((entreprise, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ fontSize: 22, color: '#f97316', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {entreprise.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                    <Chip 
                      size="small" 
                      label={`${entreprise.adminCount} admin${entreprise.adminCount > 1 ? 's' : ''}`} 
                      color="primary"
                    />
                    <Chip 
                      size="small" 
                      label={`${entreprise.activeCount} actif${entreprise.activeCount > 1 ? 's' : ''}`} 
                      color="success"
                    />
                    <Chip 
                      size="small" 
                      label={`${entreprise.adminCount - entreprise.activeCount} inactif${entreprise.adminCount - entreprise.activeCount > 1 ? 's' : ''}`} 
                      color={entreprise.adminCount - entreprise.activeCount > 0 ? "error" : "default"}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {entreprise.admins.map((admin, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: admin.isActive ? '#10b981' : '#d1d5db' }}>
                            {admin.email.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" noWrap>
                                {admin.email}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {admin.isActive ? 'Actif' : 'Inactif'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune entreprise enregistrée
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EnterpriseList;