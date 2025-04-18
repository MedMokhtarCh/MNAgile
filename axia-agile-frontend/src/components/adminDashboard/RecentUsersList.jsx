import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Person as UserIcon,
  SupervisorAccount as ChefProjetIcon,
  Today as RecentIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Work as JobTitleIcon,
} from '@mui/icons-material';

const RecentUsersList = ({ recentUsers }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <RecentIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Derniers utilisateurs créés</Typography>
      </Box>
      <List>
        {recentUsers.map((user, index) => (
          <React.Fragment key={user.id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: user.role === 'chef_projet' ? '#dcfce7' : '#e0f2fe',
                    color: user.role === 'chef_projet' ? '#16a34a' : '#3b82f6',
                  }}
                >
                  {user.prenom ? user.prenom[0].toUpperCase() : user.email[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                      {`${user.prenom || ''} ${user.nom || ''}`}
                    </Typography>
                    <Box>
                      <Tooltip title={user.role === 'chef_projet' ? 'Chef de projet' : 'Utilisateur'}>
                        <span>
                          {user.role === 'chef_projet' ? (
                            <ChefProjetIcon sx={{ mr: 1, color: '#16a34a' }} />
                          ) : (
                            <UserIcon sx={{ mr: 1, color: '#3b82f6' }} />
                          )}
                        </span>
                      </Tooltip>
                      <Chip
                        icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                        label={user.isActive ? 'Actif' : 'Inactif'}
                        size="small"
                        sx={{
                          bgcolor: user.isActive ? '#dcfce7' : '#fee2e2',
                          color: user.isActive ? '#16a34a' : '#dc2626',
                          '& .MuiChip-icon': {
                            color: user.isActive ? '#16a34a' : '#dc2626',
                          },
                        }}
                      />
                      {user.jobTitle && (
                        <Chip
                          icon={<JobTitleIcon />}
                          label={user.jobTitle}
                          size="small"
                          sx={{
                            ml: 1,
                            bgcolor: '#f3f4f6',
                            '& .MuiChip-icon': {
                              color: '#6b7280',
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {user.email}
                    </Typography>
                    <Typography component="div" variant="body2">
                      {`Créé le ${formatDate(user.dateCreated)}`}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < recentUsers.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RecentUsersList;