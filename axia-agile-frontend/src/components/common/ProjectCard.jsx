import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Avatar 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const ProjectCardStyled = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 380,
  minWidth: 300,
  height: 260,
  margin: '12px auto',
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  borderRadius: 16,
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: theme.shadows[12],
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  fontSize: 14,
  backgroundColor: theme.palette.primary.main,
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  minHeight: 40,
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  maxWidth: '75%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'hidden',
}));

const DescriptionTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  marginBottom: theme.spacing(1),
}));

const ProjectCard = ({ 
  project, 
  currentUser, 
  handleMenuOpen, 
  navigateToProject, 
  getUserDisplayName,
  getShortDescription,
  getAvatarColor,
  generateInitials 
}) => {
  const uniqueMembers = [
    ...(project.projectManagers || []),
    ...(project.productOwners || []),
    ...(project.scrumMasters || []),
    ...(project.users || []),
    ...(project.testers || []),
  ].filter((email, index, self) => self.indexOf(email) === index);

  return (
    <ProjectCardStyled onClick={() => navigateToProject(project.id)}>
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TitleContainer>
          <TitleTypography variant="h6">
            {project.title}
          </TitleTypography>
          {currentUser?.role === 'chef_projet' && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, project);
              }}
              sx={{ flexShrink: 0 }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </TitleContainer>
        <ContentContainer>
          <Box>
            <DescriptionTypography variant="body2">
              {getShortDescription(project.description)}
            </DescriptionTypography>
            <Typography
              variant="body2"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Méthode: {project.method ? project.method.charAt(0).toUpperCase() + project.method.slice(1) : 'Non spécifié'}
            </Typography>
            <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
              Créé le: {new Date(project.createdAt).toLocaleDateString('fr-FR')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {uniqueMembers.slice(0, 5).map((email, index) => (
              <UserAvatar
                key={index}
                sx={{ bgcolor: getAvatarColor(getUserDisplayName(email)) }}
              >
                {generateInitials(getUserDisplayName(email))}
              </UserAvatar>
            ))}
            {uniqueMembers.length > 5 && (
              <UserAvatar>
                +{uniqueMembers.length - 5}
              </UserAvatar>
            )}
          </Box>
        </ContentContainer>
      </CardContent>
    </ProjectCardStyled>
  );
};

export default ProjectCard;