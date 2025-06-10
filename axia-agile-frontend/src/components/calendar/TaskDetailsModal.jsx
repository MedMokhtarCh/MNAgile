import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Chip, Divider, List, ListItem, ListItemText, IconButton, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import SubtasksIcon from '@mui/icons-material/List';
import AttachmentIcon from '@mui/icons-material/Attachment';

const TaskDetailsModal = ({ selectedTask, handleCloseTaskDetails, formatDate, backlogs }) => {
  if (!selectedTask) return null;

  // Helper function to get backlog title by ID
  const getBacklogTitle = (backlogId) => {
    const backlog = backlogs?.find((b) => b.id === backlogId);
    return backlog?.title || `Backlog ${backlogId}`;
  };

  return (
    <Dialog
      open={Boolean(selectedTask)}
      onClose={handleCloseTaskDetails}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 2, p: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
          Détails de la tâche
        </Typography>
        <IconButton onClick={handleCloseTaskDetails}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{selectedTask.title}</Typography>
          <Chip
            label={selectedTask.priority}
            color={selectedTask.color}
            sx={{ mb: 1 }}
          />
          {selectedTask.status && (
            <Chip
              label={selectedTask.status}
              color="default"
              sx={{ ml: 1, mb: 1 }}
            />
          )}
        </Box>
        {selectedTask.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Description</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedTask.description}
            </Typography>
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Dates</Typography>
          <Typography variant="body2">
            <strong>Début:</strong> {formatDate(selectedTask.startDate)}
          </Typography>
          <Typography variant="body2">
            <strong>Fin:</strong> {formatDate(selectedTask.endDate)}
          </Typography>
        </Box>
        {selectedTask.assignedTo && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Assigné à</Typography>
            <Chip label={selectedTask.assignedTo} color="info" />
          </>
        )}
        {selectedTask.backlogIds && selectedTask.backlogIds.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Backlogs</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedTask.backlogIds.map((backlogId) => (
                <Chip key={backlogId} label={getBacklogTitle(backlogId)} color="secondary" />
              ))}
            </Box>
          </>
        )}
        {selectedTask.sprintId && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Sprint</Typography>
            <Chip label={`Sprint ${selectedTask.title}`} color="primary" />
          </>
        )}
        {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SubtasksIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Sous-tâches</Typography>
            </Box>
            <List dense>
              {selectedTask.subtasks.map((subtask, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={subtask.title || `Sous-tâche ${index + 1}`}
                    secondary={subtask.completed ? 'Terminé' : 'En cours'}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {selectedTask.attachments && selectedTask.attachments.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Pièces jointes</Typography>
            </Box>
            <List dense>
              {selectedTask.attachments.map((attachment, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={attachment.name || `Pièce jointe ${index + 1}`}
                    secondary={
                      attachment.url ? (
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          Télécharger
                        </a>
                      ) : 'Non disponible'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {selectedTask.metadata && Object.keys(selectedTask.metadata).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Métadonnées</Typography>
            <Typography variant="body2">
              <strong>Créé dans:</strong> {selectedTask.metadata.createdIn || 'Inconnu'}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseTaskDetails} color="primary" variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsModal;