
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const SprintCard = ({ sprint, metrics }) => {
  const isCompleted = new Date(sprint.endDate) < new Date();
  const daysRemaining = Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Card 
      elevation={4}
      sx={{ 
        mb: 3, 
        borderRadius: 3,
        overflow: 'visible',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 8,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ 
            bgcolor: isCompleted ? 'success.main' : daysRemaining < 0 ? 'error.main' : 'primary.main',
            width: 50,
            height: 50,
          }}>
            {isCompleted ? <CheckCircleIcon /> : daysRemaining < 0 ? <WarningIcon /> : <ScheduleIcon />}
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {sprint.name}
            </Typography>
            <Chip 
              label={isCompleted ? 'Terminé' : daysRemaining < 0 ? 'En retard' : `${daysRemaining}j restants`}
              color={isCompleted ? 'success' : daysRemaining < 0 ? 'error' : 'primary'}
              size="small"
            />
          </Box>
        }
        subheader={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {sprint.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📅 {new Date(sprint.startDate).toLocaleDateString('fr-FR')} → {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </Typography>
          </Box>
        }
      />
      
      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progression
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.completionRate.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={metrics.completionRate} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${
                  metrics.completionRate >= 80 ? '#4caf50, #81c784' :
                  metrics.completionRate >= 50 ? '#ff9800, #ffb74d' :
                  '#f44336, #ef5350'
                })`,
              },
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {metrics.sprintTasks.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Tâches
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                {metrics.completedTasks.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Terminées
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {metrics.totalCost.toFixed(0)} DT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coût Sprint
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Détail des Tâches
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {metrics.completedTasks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    Tâches Terminées ({metrics.completedTasks.length})
                  </Typography>
                  <Stack spacing={1}>
                    {metrics.completedTasks.map((task) => (
                      <Chip
                        key={task.id}
                        label={task.title}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {metrics.inProgressTasks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="info.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    En Cours ({metrics.inProgressTasks.length})
                  </Typography>
                  <Stack spacing={1}>
                    {metrics.inProgressTasks.map((task) => (
                      <Chip
                        key={task.id}
                        label={task.title}
                        color="info"
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {metrics.blockedTasks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" />
                    Bloquées ({metrics.blockedTasks.length})
                  </Typography>
                  <Stack spacing={1}>
                    {metrics.blockedTasks.map((task) => (
                      <Chip
                        key={task.id}
                        label={task.title}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SprintCard;