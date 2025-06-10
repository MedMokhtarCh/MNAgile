import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
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
import GetAppIcon from '@mui/icons-material/GetApp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArticleIcon from '@mui/icons-material/Article';
import CloseIcon from '@mui/icons-material/Close';
import { projectApi } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import PageTitle from '../components/common/PageTitle';
import { normalizeProject } from '../store/slices/projectsSlice';
import { generateCahierContent, resetCahier } from '../store/slices/cahierDesChargesSlice';
import { parseCahierContentToHTML, downloadCahierDesCharges } from '../utils/cahierUtils';
import { GenerateButton, DownloadButton, CahierContent } from '../components/project/theme';
import ProjectDetails from '../components/project/ProjectDetails';

const ProjectOverview = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);
  const [cahierError, setCahierError] = useState(null);
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
      setOpenModal(true);
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
    setCahierError(null);
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
        <ProjectDetails
          project={project}
          getUserDisplayName={getUserDisplayName}
          getAvatarName={getAvatarName}
          getAvatarColor={getAvatarColor}
          generateInitials={generateInitials}
        />
      )}
    </Box>
  );
};

export default ProjectOverview;