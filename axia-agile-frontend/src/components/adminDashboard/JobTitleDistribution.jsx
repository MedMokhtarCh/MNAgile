import React from 'react';
import { Paper, Typography, Box, Grid, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider } from '@mui/material';
import { Work as JobTitleIcon } from '@mui/icons-material';
import { Pie } from 'react-chartjs-2';

const JobTitleDistribution = ({ usersByJobTitle, totalUsers }) => {
  const jobTitleData = {
    labels: usersByJobTitle.map((item) => item.jobTitle),
    datasets: [
      {
        data: usersByJobTitle.map((item) => item.count),
        backgroundColor: usersByJobTitle.map((item) => item.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const jobTitleOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: {
            size: 10,
          },
        },
      },
      title: {
        display: true,
        text: 'Répartition par titre de poste',
      },
    },
  };

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <JobTitleIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Répartition par titre de poste</Typography>
      </Box>
      {usersByJobTitle.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={jobTitleData} options={jobTitleOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <List>
              {usersByJobTitle.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${item.color}33` }}>
                        <JobTitleIcon sx={{ color: item.color }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">{item.jobTitle}</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {item.count} {item.count > 1 ? 'utilisateurs' : 'utilisateur'}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {totalUsers > 0
                            ? `${Math.round((item.count / totalUsers) * 100)}% du total des utilisateurs`
                            : '0% du total'}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < usersByJobTitle.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée de titre de poste n'est disponible pour le moment.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default JobTitleDistribution;