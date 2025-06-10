// components/kanban/TaskDetails.jsx
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export const TaskDetails = ({ 
  formValues, 
  backlogs, 
  projectUsers, 
  getAvatarColor, 
  generateInitials, 
  getPriorityLabel,
  editingTask
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Informations principales</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Titre</Typography>
            <Typography variant="body1">{formValues.title || 'Non défini'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{formValues.description || 'Aucune description'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Priorité</Typography>
            <Typography variant="body1">{getPriorityLabel(formValues.priority)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Backlog associé</Typography>
            <Typography variant="body1">
              {formValues.backlogIds?.length > 0
                ? backlogs.find((b) => formValues.backlogIds.includes(b.id))?.name || 'Backlog inconnu'
                : 'Aucun backlog'}
            </Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Détails supplémentaires</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Date de début</Typography>
            <Typography variant="body1">{formValues.startDate ? new Date(formValues.startDate).toLocaleString() : 'Non définie'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Date de fin</Typography>
            <Typography variant="body1">{formValues.endDate ? new Date(formValues.endDate).toLocaleString() : 'Non définie'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Coût total estimé</Typography>
            <Typography variant="body1">
              {formValues.totalCost.toFixed(2)} D
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Assigné à</Typography>
            {formValues.assignedUsers.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formValues.assignedUsers.map((user) => (
                  <Chip
                    key={user.email}
                    avatar={<Avatar sx={{ bgcolor: getAvatarColor(user.email) }}>{generateInitials(user.email)}</Avatar>}
                    label={user.email}
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body1">Aucun utilisateur assigné</Typography>
            )}
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Sous-tâches</Typography>
            {editingTask?.subtasks?.length > 0 ? (
              <List dense>
                {editingTask.subtasks.map((subtask, index) => (
                  <ListItem key={`view-subtask-${index}`}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={false} disabled />
                    </ListItemIcon>
                    <ListItemText primary={subtask} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1">Aucune sous-tâche</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Pièces jointes</Typography>
            {editingTask?.attachments?.length > 0 ? (
              <List dense>
                {editingTask.attachments.map((attachment, index) => (
                  <ListItem
                    key={`server-attachment-${index}`}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => window.open(`${attachment.filePath}`, '_blank')}
                      >
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={attachment.fileName}
                      secondary={`Uploaded on ${new Date(attachment.uploadedAt).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1">Aucune pièce jointe</Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};