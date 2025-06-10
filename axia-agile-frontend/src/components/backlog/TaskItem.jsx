import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Chip,
  AvatarGroup,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TimelineIcon from '@mui/icons-material/Timeline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TaskItem as StyledTaskItem } from './theme';

const priorityMap = {
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

const TaskItem = ({
  backlogId,
  task,
  isSprint,
  projectUsers,
  sprints,
  getAvatarColor,
  generateInitials,
  handleOpenTaskDetailsDialog,
  handleOpenAddToSprintDialog,
  handleOpenItemDialog,
  handleOpenDeleteItemDialog,
  handleUpdateSprintItemStatus,
  isSprintOverdue,
  currentUser,
}) => {
  const sprint = isSprint ? sprints.find((s) => s.id === task.sprintId) : null;
  const isOverdue = sprint ? isSprintOverdue(sprint) : false;
  const isTaskDone = task.status === 'Terminé';
  const assignedUsers = projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [];

  return (
    <StyledTaskItem
      sx={{
        ...(isSprint && isOverdue && !isTaskDone && {
          textDecoration: 'line-through',
          opacity: 0.7,
          backgroundColor: '#f9f9f9',
        }),
      }}
    >
      {isSprint && (
        <Checkbox
          checked={isTaskDone}
          onChange={() =>
            handleUpdateSprintItemStatus(
              task.id,
              isTaskDone ? 'OPEN' : 'Terminé'
            )
          }
          disabled={isOverdue}
          sx={{ mt: 1 }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mr: 1,
              flex: '1 1 auto',
              ...(isSprint && isOverdue && !isTaskDone && { textDecoration: 'line-through' }),
            }}
          >
            {task.title}
          </Typography>
          {isSprint && isOverdue && !isTaskDone && (
            <Chip
              label="Sprint terminé"
              size="small"
              color="error"
            />
          )}
          {isSprint && task.overdueFromSprint && !isTaskDone && (
            <Chip
              label={`En retard du sprint ${task.overdueFromSprint}`}
              size="small"
              color="warning"
            />
          )}
        </Box>
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, wordBreak: 'break-word' }}
          >
            {task.description}
          </Typography>
        )}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Chip
            label={priorityMap[task.priority] || task.priority}
            size="small"
            color={
              task.priority === 'HIGH' ? 'error' :
              task.priority === 'MEDIUM' ? 'warning' :
              task.priority === 'LOW' ? 'success' : 'default'
            }
          />
          <Chip
            label={task.status}
            size="small"
            color={
              task.status === 'Terminé' ? 'success' :
              task.status === 'En À faire' ? 'info' : 'default'
            }
          />
          {task.startDate && (
            <Chip
              label={`Début: ${new Date(task.startDate).toLocaleDateString('fr-FR')}`}
              size="small"
              color="default"
            />
          )}
          {task.endDate && (
            <Chip
              label={`Fin: ${new Date(task.endDate).toLocaleDateString('fr-FR')}`}
              size="small"
              color="default"
            />
          )}
          {task.assignedUserEmails?.length > 0 && (
            <AvatarGroup max={4} sx={{ flexShrink: 0 }}>
              {task.assignedUserEmails.map((email) => (
                <Tooltip key={email} title={email}>
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(email),
                      width: 24,
                      height: 24,
                      fontSize: 12,
                    }}
                  >
                    {generateInitials(email)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
        {task.subtasks?.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">Sous-tâches :</Typography>
            <List dense sx={{ py: 0 }}>
              {task.subtasks.map((subtask, index) => (
                <ListItem key={index} sx={{ py: 0, pl: 1 }}>
                  <ListItemText
                    primary={`- ${subtask}`}
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ml: 'auto', pl: 1, flexShrink: 0 }}>
        <Tooltip title="Voir les détails de la tâche">
          <IconButton
            size="small"
            onClick={() => handleOpenTaskDetailsDialog(task)}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isSprint && currentUser?.claims?.includes('CanCreateSprints') && (
          <Tooltip title="Ajouter au sprint">
            <IconButton
              size="small"
              onClick={() => handleOpenAddToSprintDialog(backlogId, task.id)}
            >
              <TimelineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {currentUser?.claims?.includes('CanUpdateTasks') && (
          <Tooltip title="Modifier la tâche">
            <IconButton
              size="small"
              onClick={() => handleOpenItemDialog(backlogId, task)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {currentUser?.claims?.includes('CanDeleteTasks') && (
          <Tooltip title="Supprimer la tâche">
            <IconButton
              size="small"
              onClick={() => handleOpenDeleteItemDialog(task.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </StyledTaskItem>
  );
};

export default TaskItem;