import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  Chip,
  Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%'
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  }
}));

const ProjectDashboard = () => {
  const [currentProject] = useOutletContext();

  // Générer les initiales pour l'avatar
  const generateInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Obtenir la couleur de l'avatar en fonction du nom
  const getAvatarColor = (name) => {
    const colors = ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800', '#ff5722', '#795548'];
    let sum = 0;
    for (let i = 0; i < (name || '').length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des détails du projet...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Aperçu du projet
      </Typography>

      <Grid container spacing={3}>
        {/* Carte des informations du projet */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionTitle variant="h6">
              <Box display="flex" alignItems="center">
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                Informations du projet
              </Box>
            </SectionTitle>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Titre
              </Typography>
              <Typography variant="h6">
                {currentProject.title}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Description
              </Typography>
              <Typography>
                {currentProject.description}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                Créé le
              </Typography>
              <Typography>
                {new Date(currentProject.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Carte de l'équipe */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionTitle variant="h6">
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                Équipe du projet
              </Box>
            </SectionTitle>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                Chef de projet
              </Typography>
              
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: getAvatarColor(currentProject.projectManager) }}>
                    {generateInitials(currentProject.projectManager)}
                  </Avatar>
                }
                label={currentProject.projectManager}
                variant="outlined"
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Membres de l'équipe ({currentProject.users?.length || 0})
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {currentProject.users && currentProject.users.length > 0 ? (
                  currentProject.users.map(user => (
                    <Chip
                      key={user}
                      avatar={
                        <Avatar sx={{ bgcolor: getAvatarColor(user) }}>
                          {generateInitials(user)}
                        </Avatar>
                      }
                      label={user}
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucun membre d'équipe assigné
                  </Typography>
                )}
              </Box>
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box> 
  );
};

export default ProjectDashboard;
