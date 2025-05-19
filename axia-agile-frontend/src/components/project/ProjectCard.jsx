import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const ProjectCardStyled = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 380,
  minWidth: 300,
  height: 270,
  margin: '12px auto',
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  borderRadius: 20,
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 30,
  height: 30,
  fontSize: 12,
  marginLeft: -6,
  border: '2px solid white',
  zIndex: 1,
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    zIndex: 20,
  },
  '&:first-of-type': {
    marginLeft: 0,
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const FooterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: '#f9fbfd',
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  fontSize: '1.1rem',
  maxWidth: '75%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ProjectCard = ({
  project,
  currentUser,
  handleMenuOpen,
  navigateToProject,
  getUserDisplayName,
  getAvatarColor,
  generateInitials,
}) => {
  const uniqueMembers = [
    ...(project.projectManagers || []),
    ...(project.productOwners || []),
    ...(project.scrumMasters || []),
    ...(project.users || []),
    ...(project.testers || []),
    ...(project.observers || []),
  ].filter((email, index, self) => self.indexOf(email) === index);

  const formattedDate = new Date(project.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ProjectCardStyled onClick={() => navigateToProject(project.id)}>
      <ContentContainer>
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TitleTypography variant="h6">{project.title}</TitleTypography>
            {(currentUser?.claims?.includes('CanEditProjects') || currentUser?.claims?.includes('CanDeleteProjects')) && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, project);
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {project.description || 'Aucune description disponible.'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 1,
              fontWeight: 500,
              color: (theme) => theme.palette.primary.main,
            }}
          >
            Méthodologie :{' '}
            {project.method ? project.method.charAt(0).toUpperCase() + project.method.slice(1) : 'Non renseignée'}
          </Typography>
        </CardContent>
      </ContentContainer>

      <FooterBar>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Créé le {formattedDate}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {uniqueMembers.slice(0, 3).map((email, index) => (
            <Tooltip key={index} title={getUserDisplayName(email)} arrow>
              <UserAvatar
                sx={{
                  bgcolor: getAvatarColor(getUserDisplayName(email)),
                  zIndex: 10 - index,
                }}
              >
                {generateInitials(getUserDisplayName(email))}
              </UserAvatar>
            </Tooltip>
          ))}
          {uniqueMembers.length > 3 && (
            <Tooltip title={`${uniqueMembers.length - 3} autres`} arrow>
              <UserAvatar sx={{ bgcolor: '#1976d2', zIndex: 6 }}>
                +{uniqueMembers.length - 3}
              </UserAvatar>
            </Tooltip>
          )}
        </Box>
      </FooterBar>
    </ProjectCardStyled>
  );
};

export default ProjectCard;