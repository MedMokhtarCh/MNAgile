import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import GetAppIcon from '@mui/icons-material/GetApp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArticleIcon from '@mui/icons-material/Article';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { projectApi } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import UserRoleSection from '../components/common/UserRoleSection';
import PageTitle from '../components/common/PageTitle';
import { normalizeProject } from '../store/slices/projectsSlice';
import { generateCahierContent, resetCahier } from '../store/slices/cahierDesChargesSlice';
import { parseCahierContentToHTML, downloadCahierDesCharges } from '../utils/cahierUtils';

// Styled components remain unchanged
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

const GenerateButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  borderRadius: 25,
  border: 0,
  color: 'white',
  height: 56,
  padding: '0 30px',
  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'linear-gradient(45deg, #ccc 30%, #ddd 90%)',
    boxShadow: 'none',
    transform: 'none',
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
  borderRadius: 25,
  border: 0,
  color: 'white',
  height: 48,
  padding: '0 25px',
  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
    transform: 'translateY(-1px)',
  },
}));

const CahierContainer = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  border: '1px solid #e3f2fd',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
}));

const CahierContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(4),
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  lineHeight: 1.7,
  color: '#333',
  '& h1': {
    textAlign: 'center',
    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    textShadow: 'none',
  },
  '& .subtitle': {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    fontSize: '18px',
    marginBottom: theme.spacing(4),
    padding: theme.spacing(2),
    background: 'rgba(25, 118, 210, 0.05)',
    borderRadius: 12,
    border: '1px solid rgba(25, 118, 210, 0.1)',
  },
  '& .section': {
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e8eaf6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      transform: 'translateY(-1px)',
    },
  },
  '& .section-title, & h2': {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1976d2',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    borderBottom: '3px solid #e3f2fd',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -3,
      left: 0,
      width: '60px',
      height: '3px',
      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
      borderRadius: '2px',
    },
  },
  '& h3': {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1565c0',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  '& p': {
    marginBottom: theme.spacing(2),
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#444',
    textAlign: 'justify',
  },
  '& ul': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(0.5),
      fontSize: '15px',
      lineHeight: 1.6,
      color: '#555',
      position: 'relative',
      '&::marker': {
        color: '#1976d2',
        fontWeight: 'bold',
      },
    },
  },
  '& .footer': {
    textAlign: 'center',
    marginTop: theme.spacing(6),
    padding: theme.spacing(3),
    background: 'linear-gradient(135deg, #f5f5f5, #e8eaf6)',
    borderRadius: 12,
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    border: '1px solid #e0e0e0',
  },
  '& .warning': {
    color: '#d32f2f',
    fontStyle: 'italic',
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    background: 'rgba(211, 47, 47, 0.1)',
    borderRadius: 8,
    border: '1px solid rgba(211, 47, 47, 0.2)',
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '20px 0',
  },
  '& th, & td': {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
}));

const CahierHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
  color: 'white',
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& .title': {
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 600,
    '& svg': {
      marginRight: theme.spacing(1),
      fontSize: '28px',
    },
  },
}));

const ProjectOverview = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState(null); // Renamed for clarity
  const [cahierError, setCahierError] = useState(null); // Separate error for cahier generation
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users } = useUsers('users');
  const { content: cahierContent, isGenerating, error: reduxCahierError, isTruncated } = useSelector((state) => state.cahierDesCharges);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setProjectError(null);
        const response = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(response.data);
        setProject(normalizedProject);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          setProjectError(`Le projet avec l'ID ${projectId} n'existe pas.`);
        } else {
          setProjectError(
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
      setProjectError('ID du projet manquant.');
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

  const handleGenerateCahierDesCharges = async () => {
    try {
      await dispatch(generateCahierContent({ project, users, getUserDisplayName })).unwrap();
      setOpenModal(true); // Open modal only on success
      setCahierError(null);
    } catch (err) {
      setCahierError(reduxCahierError || 'Échec de la génération du cahier des charges.');
      setSnackbar({
        open: true,
        message: reduxCahierError || 'Échec de la génération du cahier des charges.',
        severity: 'error',
      });
    }
  };

  const handleDownloadCahier = () => {
    try {
      downloadCahierDesCharges(cahierContent, project);
    } catch (err) {
      setCahierError('Échec du téléchargement du cahier des charges.');
      setSnackbar({
        open: true,
        message: 'Échec du téléchargement du cahier des charges.',
        severity: 'error',
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCahierError(null); // Reset cahier-specific error
    dispatch(resetCahier());
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des détails du projet...</Typography>
      </Box>
    );
  }

  if (projectError && !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Erreur : {projectError}</Typography>
        {projectError.includes("n'existe pas") && (
          <Typography>
            Le projet avec l'ID ${projectId} n'existe pas ou vous n'y avez pas accès.
          </Typography>
        )}
      </Box>
    );
  }

  const parsedCahierContent = parseCahierContentToHTML(cahierContent, project, isTruncated);

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Aperçu du projet</PageTitle>

      {/* Snackbar for cahier generation errors */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <GenerateButton
          onClick={handleGenerateCahierDesCharges}
          disabled={isGenerating || !project}
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
        >
          {isGenerating ? 'Génération en cours...' : 'Générer Cahier des Charges'}
        </GenerateButton>
        
        {cahierContent && !isGenerating && (
          <Zoom in={true}>
            <DownloadButton
              onClick={handleDownloadCahier}
              startIcon={<GetAppIcon />}
            >
              Télécharger
            </DownloadButton>
          </Zoom>
        )}
      </Box>

      {isGenerating && (
        <Fade in={isGenerating}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            my: 4,
            p: 4,
            background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
            borderRadius: 3,
            border: '1px solid #e1f5fe'
          }}>
            <CircularProgress size={50} thickness={4} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Génération du cahier des charges...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Analyse du projet et création du document professionnel
            </Typography>
          </Box>
        </Fade>
      )}

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            maxHeight: '80vh',
            overflowY: 'auto',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#1976d2', color: 'white' }}>
          <Box display="flex" alignItems="center">
            <ArticleIcon sx={{ mr: 1 }} />
            Cahier des Charges - {project?.title || 'Projet sans titre'}
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <CahierContent>
            <div dangerouslySetInnerHTML={{ __html: parsedCahierContent || '<p>Aucun contenu disponible.</p>' }} />
            {cahierError && (
              <Typography className="warning">
                Erreur lors de la génération : {cahierError}
              </Typography>
            )}
          </CahierContent>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DownloadButton
            onClick={handleDownloadCahier}
            startIcon={<GetAppIcon />}
            disabled={!cahierContent}
          >
            Télécharger
          </DownloadButton>
          <Button onClick={handleCloseModal} variant="outlined" color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {project && (
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
      )}
    </Box>
  );
};

export default ProjectOverview;