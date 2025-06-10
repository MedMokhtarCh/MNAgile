import React from 'react';
import { Popover, Box, Typography, Chip, Button } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

const TaskPopover = ({ taskPopover, handleCloseTaskPopover, handleOpenTaskDetails, formatDate }) => {
  if (!taskPopover.task) return null;
  const { task } = taskPopover;
  const open = Boolean(taskPopover.anchorEl);
  const id = open ? 'task-popover' : undefined;

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={taskPopover.anchorEl}
      onClose={handleCloseTaskPopover}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 1 }}
    >
      <Box sx={{ width: 320, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mr: 2 }}>
            {task.title}
          </Typography>
          <Chip
            label={task.priority}
            size="small"
            color={task.color}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        </Box>
        {task.description && (
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
          </Typography>
        )}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <EventIcon color="action" sx={{ fontSize: '1rem', mr: 1 }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              <strong>Début:</strong> {formatDate(task.startDate)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon color="action" sx={{ fontSize: '1rem', mr: 1 }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              <strong>Fin:</strong> {formatDate(task.endDate)}
            </Typography>
          </Box>
        </Box>
        {task.assignedTo && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
              Assigné à:
            </Typography>
            <Chip
              label={task.assignedTo}
              size="small"
              color="info"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => handleOpenTaskDetails(task)}
          >
            Détails
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

export default TaskPopover;