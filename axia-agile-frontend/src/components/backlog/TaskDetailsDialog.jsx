import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Card,
  CardContent,
  Stack,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SprintIcon from '@mui/icons-material/Timeline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import TaskIcon from '@mui/icons-material/Task';
import PersonIcon from '@mui/icons-material/Person';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WarningIcon from '@mui/icons-material/Warning';
import { FormDialogContent } from './theme';

// Palette de bleus
const bluePalette = {
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  secondary: '#2196f3',
  secondaryLight: '#4fc3f7',
  secondaryDark: '#0d47a1',
  background: '#f5f9ff',
  paper: '#ffffff',
};

const priorityMap = {
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

const priorityColors = {
  HIGH: '#f44336',
  MEDIUM: '#ff9800',
  LOW: '#4caf50',
};

const statusColors = {
  Terminé: '#4caf50',
  'À faire': bluePalette.secondary,
  'En cours': '#ff9800',
};

function TaskDetailsDialog({
  open,
  onClose,
  selectedTask,
  projectUsers,
  sprints,
  getAvatarColor,
  generateInitials,
  handleOpenItemDialog,
  currentUser,
}) {
  if (!selectedTask) return null;

  const assignedUsers = projectUsers.filter((u) => selectedTask.assignedUserEmails?.includes(u.email)) || [];
  const sprint = sprints.find((s) => s.id === selectedTask.sprintId);
  const overdueSprint = selectedTask.overdueFromSprint
    ? sprints.find((s) => s.name === selectedTask.overdueFromSprint)
    : null;

  const handleEditClick = () => {
    onClose(); // Close TaskDetailsDialog
    handleOpenItemDialog(selectedTask.backlogIds?.[0], selectedTask, true); // Open ItemDialog
  };

  const InfoSection = ({ icon, title, children, sx = {} }) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: bluePalette.paper,
        borderColor: '#e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        transition: 'all 0.2s ease',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            backgroundColor: bluePalette.primaryLight,
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
          }}
        >
          {React.cloneElement(icon, { sx: { color: 'white', fontSize: 18 } })}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: bluePalette.primaryDark }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableBackdropClick
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          backgroundColor: bluePalette.background,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${bluePalette.primary} 0%, ${bluePalette.primaryDark} 100%)`,
          color: 'white',
          py: 2.5,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TaskIcon sx={{ mr: 1.5, color: 'white' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Détails de la tâche
          </Typography>
        </Box>
        <Box>
          {currentUser?.claims?.includes('CanUpdateTasks') && (
            <Tooltip title="Modifier la tâche">
              <IconButton
                onClick={handleEditClick}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Fermer">
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <FormDialogContent sx={{ p: 3 }}>
        {/* Titre et Description */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: 'none',
            border: `1px solid ${bluePalette.primaryLight}`,
            backgroundColor: bluePalette.paper,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontWeight: 700,
                color: bluePalette.primaryDark,
                pb: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 24,
                  backgroundColor: bluePalette.primary,
                  borderRadius: 1,
                  mr: 2,
                }}
              />
              {selectedTask.title}
            </Typography>
            {selectedTask.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.7,
                  backgroundColor: '#f8faff',
                  p: 2.5,
                  borderRadius: 1,
                  borderLeft: `4px solid ${bluePalette.secondary}`,
                }}
              >
                {selectedTask.description}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Stack spacing={2}>
          {/* Priorité et Statut */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <InfoSection icon={<PriorityHighIcon />} title="Priorité" sx={{ flex: 1, minWidth: 200 }}>
              <Chip
                label={priorityMap[selectedTask.priority] || selectedTask.priority}
                sx={{
                  backgroundColor: priorityColors[selectedTask.priority] || '#666',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '& .MuiChip-label': { px: 2 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </InfoSection>

            <InfoSection icon={<TaskIcon />} title="Statut" sx={{ flex: 1, minWidth: 200 }}>
              <Chip
                label={selectedTask.status}
                sx={{
                  backgroundColor: statusColors[selectedTask.status] || '#666',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '& .MuiChip-label': { px: 2 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </InfoSection>
          </Box>

          {/* Dates */}
          {(selectedTask.startDate || selectedTask.endDate) && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {selectedTask.startDate && (
                <InfoSection
                  icon={<CalendarTodayIcon />}
                  title="Date de début"
                  sx={{ flex: 1, minWidth: 200 }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: bluePalette.primaryDark }}
                  >
                    {new Date(selectedTask.startDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </InfoSection>
              )}

              {selectedTask.endDate && (
                <InfoSection icon={<EventIcon />} title="Date de fin" sx={{ flex: 1, minWidth: 200 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: bluePalette.primaryDark }}
                  >
                    {new Date(selectedTask.endDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </InfoSection>
              )}
            </Box>
          )}

          {/* Coût, Sprint et Retard */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {selectedTask.totalCost != null && (
              <InfoSection
                icon={<AttachMoneyIcon />}
                title="Coût total estimé"
                sx={{ flex: 1, minWidth: 200 }}
              >
                <Typography variant="h6" sx={{ color: bluePalette.primary, fontWeight: 700 }}>
                  {selectedTask.totalCost.toFixed(2)} DT
                </Typography>
              </InfoSection>
            )}

            {sprint && (
              <InfoSection icon={<SprintIcon />} title="Sprint" sx={{ flex: 1, minWidth: 200 }}>
                <Chip
                  label={sprint.name}
                  variant="outlined"
                  sx={{
                    borderColor: bluePalette.primary,
                    color: bluePalette.primaryDark,
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 2 },
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  }}
                />
              </InfoSection>
            )}

            {overdueSprint && (
              <InfoSection
                icon={<WarningIcon />}
                title="Retardé du sprint"
                sx={{ flex: 1, minWidth: 200 }}
              >
                <Chip
                  label={`Retardé du sprint ${overdueSprint.name}`}
                  sx={{
                    backgroundColor: '#ff9800',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    '& .MuiChip-label': { px: 2 },
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </InfoSection>
            )}
          </Box>

          {/* Membres assignés */}
          {assignedUsers.length > 0 && (
            <InfoSection icon={<PersonIcon />} title="Membres assignés">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                {assignedUsers.map((user) => (
                  <Box
                    key={user.email}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      backgroundColor: bluePalette.paper,
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${bluePalette.primaryLight}`,
                      minWidth: 220,
                      '&:hover': {
                        boxShadow: `0 4px 12px rgba(${bluePalette.primary.replace('#', '')},0.1)`,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(user.email),
                        width: 40,
                        height: 40,
                        fontSize: 16,
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {generateInitials(user.email)}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: bluePalette.primaryDark }}
                      >
                        {user.name || 'Utilisateur'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </InfoSection>
          )}

          {/* Sous-tâches */}
          {selectedTask.subtasks?.length > 0 && (
            <InfoSection icon={<ChecklistIcon />} title="Sous-tâches">
              <List
                sx={{
                  backgroundColor: bluePalette.paper,
                  borderRadius: 2,
                  mt: 1,
                  border: `1px solid ${bluePalette.primaryLight}`,
                  py: 0,
                }}
              >
                {selectedTask.subtasks.map((subtask, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        py: 1.5,
                        '&:hover': { backgroundColor: '#f5f9ff' },
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: bluePalette.primary,
                          mr: 2,
                          mt: 0.5,
                        }}
                      />
                      <ListItemText
                        primary={subtask}
                        primaryTypographyProps={{
                          variant: 'body1',
                          sx: { fontWeight: 500, color: bluePalette.primaryDark },
                        }}
                      />
                    </ListItem>
                    {index < selectedTask.subtasks.length - 1 && (
                      <Divider variant="inset" component="li" sx={{ ml: 4 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </InfoSection>
          )}
        </Stack>
      </FormDialogContent>

      <DialogActions
        sx={{
          p: 3,
          backgroundColor: bluePalette.paper,
          borderTop: `1px solid ${bluePalette.primaryLight}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${bluePalette.primary} 0%, ${bluePalette.primaryDark} 100%)`,
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9375rem',
            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskDetailsDialog;