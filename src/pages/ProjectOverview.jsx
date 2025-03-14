import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Paper,
  Divider,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { useParams } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const ProjectOverview = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const foundProject = projects.find(p => p.id === projectId);
    
    if (foundProject) {
      setProject(foundProject);
      
      
      localStorage.setItem('activeProject', JSON.stringify(foundProject));
    }
    
  
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    setRegisteredUsers(storedUsers.map(user => ({
      id: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      company: user.company
    })));
    
    setLoading(false);
  }, [projectId]);

  // Generate avatar with initials
  const generateInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };


  const getUserDisplayName = (email) => {
    const user = registeredUsers.find(u => u.email === email);
    return user ? user.name : email;
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Chargement...</Box>;
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Projet non trouvé.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Vue d'ensemble</Typography>
      
      <Grid container spacing={3}>
       
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Informations du projet
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} />
                {project.title}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {project.description}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 'small', mr: 1 }} />
                Créé le: {new Date(project.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Chef de projet:</Typography>
              <Chip 
                avatar={
                  <Avatar>{generateInitials(getUserDisplayName(project.projectManager))}</Avatar>
                }
                label={getUserDisplayName(project.projectManager)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
       
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Équipe
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CodeIcon sx={{ fontSize: 'small', mr: 1 }} />
                  Développeurs
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.users && project.users.length > 0 ? (
                    project.users.map(email => (
                      <Chip 
                        key={email}
                        size="small"
                        avatar={<Avatar>{generateInitials(getUserDisplayName(email))}</Avatar>}
                        label={getUserDisplayName(email)}
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun développeur
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BugReportIcon sx={{ fontSize: 'small', mr: 1 }} />
                  Testeurs
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.testers && project.testers.length > 0 ? (
                    project.testers.map(email => (
                      <Chip 
                        key={email}
                        size="small"
                        avatar={<Avatar>{generateInitials(getUserDisplayName(email))}</Avatar>}
                        label={getUserDisplayName(email)}
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun testeur
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SpeedIcon sx={{ fontSize: 'small', mr: 1 }} />
                  Scrum Masters
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.scrumMasters && project.scrumMasters.length > 0 ? (
                    project.scrumMasters.map(email => (
                      <Chip 
                        key={email}
                        size="small"
                        avatar={<Avatar>{generateInitials(getUserDisplayName(email))}</Avatar>}
                        label={getUserDisplayName(email)}
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun Scrum Master
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
       
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Statistiques du projet
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                  0
                </Typography>
                <Typography variant="body2">Tâches en backlog</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                  0
                </Typography>
                <Typography variant="body2">Tâches en cours</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  0
                </Typography>
                <Typography variant="body2">Tâches terminées</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  0
                </Typography>
                <Typography variant="body2">Tâches terminées</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                  0
                </Typography>
                <Typography variant="body2">Bugs identifiés</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        
       
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Progression du projet
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Avancement global</Typography>
                  <Typography variant="body2" fontWeight="bold">0%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={0} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>Sprints</Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Aucun sprint planifié pour le moment
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectOverview;