import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  Collapse,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { AccessTime as AccessTimeIcon, Assignment as AssignmentIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Pie } from 'react-chartjs-2';
import { formatDate } from '../../utils/backlogUtils';
import { sprintCardStyles } from './theme';

const CardSprint = ({ sprint, tasks, daysRemaining, expanded, handleToggleSprint }) => {
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
      elevation={3}
      sx={sprintCardStyles.paper(daysRemaining[sprint.id]?.isExpired)}
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
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                sx={sprintCardStyles.chipHigh}
              />
              <Chip
                icon={<AssignmentIcon />}
                label={`Moyenne: ${tasksByPriority.MEDIUM}`}
                size="small"
                sx={sprintCardStyles.chipMedium}
              />
              <Chip
                icon={<AssignmentIcon />}
                label={`Basse: ${tasksByPriority.LOW}`}
                size="small"
                sx={sprintCardStyles.chipLow}
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
      <Collapse in={expanded} timeout="auto" unmountOnExit>
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
};

export default CardSprint;