import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchAllTasks, clearTasksError } from '../store/slices/taskSlice';
import { fetchSprints } from '../store/slices/sprintSlice';
import { fetchProjects, normalizeProject } from '../store/slices/projectsSlice';
import { projectApi } from '../services/api';
import PageTitle from '../components/common/PageTitle';
import CardSprint from '../components/activesprint/CardSprint';
import { sprintCardStyles } from '../components/activesprint/theme';
import { calculateDaysRemaining, formatDate } from '../utils/backlogUtils';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ActiveSprintPage = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const {
    tasks: { tasks, status: tasksStatus, error: tasksError },
    sprints: { sprints },
    projects: { projects, status: projectsStatus, error: projectsError },
  } = useSelector((state) => ({
    tasks: state.tasks,
    sprints: state.sprints,
    projects: state.projects,
  }));
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSprint, setExpandedSprint] = useState({});
  const [daysRemaining, setDaysRemaining] = useState({});

  // Fetch project, sprints, and tasks on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!projectId || isNaN(parseInt(projectId))) {
          throw new Error('ID du projet invalide');
        }

        console.log('[ActiveSprintPage] Fetching data for projectId:', projectId);
        const projectResponse = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(projectResponse.data);
        setProject(normalizedProject);

        if (projectsStatus === 'idle') {
          await dispatch(fetchProjects()).unwrap();
        }

        await Promise.all([
          dispatch(fetchSprints({ projectId: parseInt(projectId) })).unwrap(),
          dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap(),
        ]);
      } catch (err) {
        console.error('[ActiveSprintPage] Error:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data,
          } : null,
        });
        const errorMessage =
          err.response?.status === 404
            ? `Le projet avec l'ID ${projectId} n'existe pas.`
            : err.response?.status === 401
            ? 'Non autorisé. Veuillez vous reconnecter.'
            : err.response?.data?.message || err.message || 'Erreur lors du chargement des données';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, dispatch, projectsStatus]);

  // Update days remaining for each sprint every day
  useEffect(() => {
    if ((sprints || []).length > 0) {
      const updateDays = () => {
        const newDaysRemaining = {};
        (sprints || []).forEach((sprint) => {
          newDaysRemaining[sprint.id] = calculateDaysRemaining(sprint.endDate);
        });
        setDaysRemaining(newDaysRemaining);
      };

      updateDays();
      const timer = setInterval(updateDays, 24 * 60 * 60 * 1000);
      return () => clearInterval(timer);
    }
  }, [sprints]);

  // Handle expanding/collapsing sprint details
  const handleToggleSprint = (sprintId) => {
    setExpandedSprint((prev) => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  // Memoized sorted sprints
  const sortedSprints = useMemo(() => {
    return [...(sprints || [])].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [sprints]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error || tasksError || projectsError) {
    return (
      <Box sx={{ p: 3, bgcolor: '#fff' }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearTasksError());
                setError('');
                dispatch(fetchProjects());
                dispatch(fetchSprints({ projectId: parseInt(projectId) }));
                dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
              }}
            >
              Réessayer
            </Button>
          }
        >
          {error || tasksError || projectsError || 'Erreur lors du chargement des données.'}
        </Alert>
      </Box>
    );
  }

  // No sprints state
  if (!(sprints || []).length) {
    return (
      <Box sx={{ p: 3, bgcolor: '#fff' }}>
        <PageTitle>Rapport des Sprints du Projet : {project?.title || 'Inconnu'}</PageTitle>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
          0 sprint
        </Typography>
        <Paper sx={sprintCardStyles.noSprintPaper}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5">Aucun sprint disponible</Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    N/A - N/A
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Créez un sprint pour commencer.
                  </Typography>
                </Box>
                <IconButton disabled>
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon color="disabled" sx={{ mr: 1 }} />
                  <Typography variant="body1">Aucun délai</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Progression temporelle: 0%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={0}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Statistiques des tâches
                </Typography>
                <Typography variant="body1">Total des tâches: 0</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Haute: 0"
                    size="small"
                    sx={sprintCardStyles.chipHigh}
                  />
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Moyenne: 0"
                    size="small"
                    sx={sprintCardStyles.chipMedium}
                  />
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Basse: 0"
                    size="small"
                    sx={sprintCardStyles.chipLow}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <PageTitle>Rapport des Sprints du Projet : {project?.title || 'Inconnu'}</PageTitle>
      <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
        {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} au total
      </Typography>

      {/* Sprint List */}
      {sortedSprints.map((sprint) => (
        <CardSprint
          key={sprint.id}
          sprint={sprint}
          tasks={tasks}
          daysRemaining={daysRemaining}
          expanded={expandedSprint[sprint.id]}
          handleToggleSprint={handleToggleSprint}
        />
      ))}
    </Box>
  );
};

export default ActiveSprintPage;