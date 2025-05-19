import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  CardHeader,
  CardContent,
  LinearProgress,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  Collapse,
  IconButton,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { fetchSprints, fetchAllTasks, clearTasksError } from '../store/slices/taskSlice';
import { fetchProjects, normalizeProject } from '../store/slices/projectsSlice';
import { projectApi } from '../services/api';
import PageTitle from '../components/common/PageTitle';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  } catch {
    return 'Date invalide';
  }
};

// Calculate days remaining in a sprint
const calculateDaysRemaining = (endDate) => {
  if (!endDate) return { days: 0, isExpired: true };
  const now = new Date();
  const endDateTime = new Date(endDate);
  const timeDifference = endDateTime - now;

  if (timeDifference <= 0) {
    return { days: 0, isExpired: true };
  }

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return { days, isExpired: false };
};

const ActiveSprintPage = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { sprints, tasks, status: tasksStatus, error: tasksError } = useSelector((state) => state.tasks);
  const { projects, status: projectsStatus, error: projectsError } = useSelector((state) => state.projects);
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

        // Fetch projects if not already loaded
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
    if (sprints.length > 0) {
      const updateDays = () => {
        const newDaysRemaining = {};
        sprints.forEach((sprint) => {
          newDaysRemaining[sprint.id] = calculateDaysRemaining(sprint.endDate);
        });
        setDaysRemaining(newDaysRemaining);
      };

      updateDays(); // Initial calculation
      const timer = setInterval(updateDays, 24 * 60 * 60 * 1000); // Update daily

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
    return [...sprints].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
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
  if (!sprints || sprints.length === 0) {
    return (
      <Box sx={{ p: 3, bgcolor: '#fff' }}>
        <PageTitle>Rapport des Sprints du Projet : {project?.title || 'Inconnu'}</PageTitle>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
          0 sprint
        </Typography>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            borderLeft: '5px solid #B0BEC5',
          }}
        >
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
                    sx={{ bgcolor: '#F44336', color: 'white', minWidth: 100 }}
                  />
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Moyenne: 0"
                    size="small"
                    sx={{ bgcolor: '#FFC107', color: 'black', minWidth: 100 }}
                  />
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Basse: 0"
                    size="small"
                    sx={{ bgcolor: '#4CAF50', color: 'white', minWidth: 100 }}
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
      {sortedSprints.map((sprint) => {
        // Get tasks for this sprint
        const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id);

        // Total tasks and subtasks
        const totalTasks = sprintTasks.length;
        const totalSubtasks = sprintTasks.reduce((acc, task) => acc + (task.subtasks?.length || 0), 0);
        const completedSubtasks = sprintTasks.reduce(
          (acc, task) => acc + (task.subtasks?.filter((sub) => sub.completed).length || 0),
          0
        );

        // Task priority distribution
        const tasksByPriority = {
          HIGH: sprintTasks.filter((task) => task.priority === 'HIGH').length,
          MEDIUM: sprintTasks.filter((task) => task.priority === 'MEDIUM').length,
          LOW: sprintTasks.filter((task) => task.priority === 'LOW').length,
        };

        // Calculate progress percentage
        const startDate = new Date(sprint.startDate).getTime();
        const endDate = new Date(sprint.endDate).getTime();
        const now = new Date().getTime();
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        const progress = totalDuration > 0 ? Math.min(Math.round((elapsed / totalDuration) * 100), 100) : 0;

        // Priority chart data
        const taskPriorityData = {
          labels: ['Haute', 'Moyenne', 'Basse'],
          datasets: [
            {
              data: [tasksByPriority.HIGH, tasksByPriority.MEDIUM, tasksByPriority.LOW],
              backgroundColor: ['#F44336', '#FFC107', '#4CAF50'],
              borderWidth: 1,
            },
          ],
        };

        return (
          <Paper
            key={sprint.id}
            elevation={3}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              borderLeft: `5px solid ${daysRemaining[sprint.id]?.isExpired ? '#F44336' : '#2196F3'}`,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5">{sprint.name}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {sprint.description || 'Aucune description'}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => handleToggleSprint(sprint.id)}>
                    {expandedSprint[sprint.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {daysRemaining[sprint.id]?.isExpired
                        ? 'Sprint terminé'
                        : `${daysRemaining[sprint.id]?.days} jour${daysRemaining[sprint.id]?.days !== 1 ? 's' : ''} restant${daysRemaining[sprint.id]?.days !== 1 ? 's' : ''}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Progression temporelle: {progress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
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
                  <Typography variant="body1">
                    Total des tâches: {totalTasks}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`Haute: ${tasksByPriority.HIGH}`}
                      size="small"
                      sx={{ bgcolor: '#F44336', color: 'white', minWidth: 100 }}
                    />
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`Moyenne: ${tasksByPriority.MEDIUM}`}
                      size="small"
                      sx={{ bgcolor: '#FFC107', color: 'black', minWidth: 100 }}
                    />
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`Basse: ${tasksByPriority.LOW}`}
                      size="small"
                      sx={{ bgcolor: '#4CAF50', color: 'white', minWidth: 100 }}
                    />
                  </Box>
                  {totalSubtasks > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Sous-tâches: {completedSubtasks}/{totalSubtasks} complétées
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Priority Distribution Chart */}
            <Collapse in={expandedSprint[sprint.id]} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Répartition des tâches par priorité" />
                    <CardContent>
                      <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                        <Pie data={taskPriorityData} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
};

export default ActiveSprintPage;