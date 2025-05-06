import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/material/styles';
import { projectApi } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import UserRoleSection from '../components/common/UserRoleSection';
import PageTitle from '../components/common/PageTitle';

const normalizeProject = (project) => ({
  id: String(project.id || project.Id || ''),
  title: project.title || project.Title || '',
  description: project.description || project.Description || '',
  methodology: project.methodology || project.Methodology || '',
  createdAt: project.createdAt || project.CreatedAt || new Date().toISOString(),
  startDate: project.startDate || project.StartDate || new Date().toISOString(),
  endDate: project.endDate || project.EndDate || new Date().toISOString(),
  createdBy: project.createdBy || project.CreatedBy || '',
  projectManagers: project.projectManagers || project.ProjectManagers || [],
  productOwners: project.productOwners || project.ProductOwners || [],
  scrumMasters: project.scrumMasters || project.ScrumMasters || [],
  users: project.developers || project.Developers || [],
  testers: project.testers || project.Testers || [],
  observers: project.observers || project.Observers || [],
});

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
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users } = useUsers('users');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(response.data);
        setProject(normalizedProject);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          setError(`Le projet avec l'ID ${projectId} n'existe pas.`);
        } else {
          setError(
            err.response?.data?.message ||
              err.response?.data?.detail ||
              'Échec de la récupération des détails du projet.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    } else {
      setError('ID du projet manquant.');
      setLoading(false);
    }
  }, [projectId, navigate]);

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user
      ? `${user.firstName || user.nom || ''} ${user.lastName || user.prenom || ''}`.trim() || user.email
      : email;
  };

  const getAvatarName = (email) => {
    const user = users.find((u) => u.email === email);
    return user && (user.firstName || user.nom) && (user.lastName || user.prenom)
      ? `${user.firstName || user.nom} ${user.lastName || user.prenom}`
      : email || 'Utilisateur';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des détails du projet...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Erreur : {error}</Typography>
        {error.includes("n'existe pas") && (
          <Typography>
            Le projet avec l'ID {projectId} n'existe pas ou vous n'y avez pas accès.
          </Typography>
        )}
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Projet non trouvé.</Typography>
        <Typography>
          Le projet avec l'ID {projectId} n'existe pas ou vous n'y avez pas accès.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Aperçu du projet</PageTitle>

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
    </Box>
  );
};

export default ProjectOverview;