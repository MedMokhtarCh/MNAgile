import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/material/styles';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import UserRoleSection from '../components/common/UserRoleSection';
import PageTitle from '../components/common/PageTitle';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
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
  },
}));

const ProjectOverview = () => {
  const [currentProject] = useOutletContext();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users } = useUsers('users');

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? `${user.nom} ${user.prenom}` : email;
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
     
      <PageTitle>Aperçu du projet</PageTitle>

      <Grid container spacing={3}>
        {/* Informations du projet */}
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
              <Typography variant="h6">{currentProject.title}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Description
              </Typography>
              <Typography>{currentProject.description}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Méthode Agile
              </Typography>
              <Typography>
                {currentProject.method ? currentProject.method.charAt(0).toUpperCase() + currentProject.method.slice(1) : 'Non spécifié'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                Créé le
              </Typography>
              <Typography>{new Date(currentProject.createdAt).toLocaleDateString('fr-FR')}</Typography>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Équipe du projet */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionTitle variant="h6">
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                Équipe du projet
              </Box>
            </SectionTitle>

            <UserRoleSection
              title="Chefs de projet"
              users={currentProject.projectManagers}
              getUserDisplayName={getUserDisplayName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Product Owners"
              users={currentProject.productOwners}
              getUserDisplayName={getUserDisplayName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <UserRoleSection
              title="Scrum Masters"
              users={currentProject.scrumMasters}
              getUserDisplayName={getUserDisplayName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <UserRoleSection
              title="Développeurs"
              users={currentProject.users}
              getUserDisplayName={getUserDisplayName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <UserRoleSection
              title="Testeurs"
              users={currentProject.testers}
              getUserDisplayName={getUserDisplayName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectOverview;
