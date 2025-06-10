import React from 'react';
import { Grid, Divider, Box, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import UserRoleSection from '../common/UserRoleSection';
import { StyledPaper, SectionTitle } from './theme';

const ProjectDetails = ({
  project,
  getUserDisplayName,
  getAvatarName,
  getAvatarColor,
  generateInitials,
}) => {
  return (
    <Grid container spacing={3}>
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
            <Typography
              variant="h6"
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {project.title}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Description
            </Typography>
            <Typography
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {project.description || 'Aucune description disponible.'}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Méthode Agile
            </Typography>
            <Typography>
              {project.methodology
                ? project.methodology.charAt(0).toUpperCase() +
                  project.methodology.slice(1)
                : 'Non spécifié'}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
              Créé le
            </Typography>
            <Typography>
              {new Date(project.createdAt).toLocaleDateString('fr-FR')}
            </Typography>
          </Box>
        </StyledPaper>
      </Grid>

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
            users={project.projectManagers || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />

          <Divider sx={{ my: 2 }} />

          <UserRoleSection
            title="Product Owners"
            users={project.productOwners || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />

          <Divider sx={{ my: 2 }} />

          <UserRoleSection
            title="Scrum Masters"
            users={project.scrumMasters || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />

          <Divider sx={{ my: 2 }} />

          <UserRoleSection
            title="Développeurs"
            users={project.users || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />

          <Divider sx={{ my: 2 }} />

          <UserRoleSection
            title="Testeurs"
            users={project.testers || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />

          <Divider sx={{ my: 2 }} />

          <UserRoleSection
            title="Observateurs"
            users={project.observers || []}
            getUserDisplayName={getUserDisplayName}
            getAvatarName={getAvatarName}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
          />
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default ProjectDetails;