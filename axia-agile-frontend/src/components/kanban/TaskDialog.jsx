// components/kanban/TaskDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  OutlinedInput,
  MenuItem,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Autocomplete,
  Typography,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Flag,
  AttachFile as AttachFileIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { StyledButton, StyledDialog } from './theme';
import InputUserAssignment from '../common/InputUserAssignment';
import { TaskDetails } from './TaskDetails';

export const TaskDialog = ({
  open,
  onClose,
  dialogMode,
  isEditing,
  isCreatingTask,
  kanbanError,
  formValues,
  handleFormChange,
  handleFormSubmit,
  currentColumn,
  editingTask,
  projectUsers,
  backlogs,
  getAvatarColor,
  generateInitials,
  getPriorityLabel,
  subtasks,
  newSubtask,
  setNewSubtask,
  handleAddSubtask,
  handleRemoveSubtask,
  handleToggleSubtask,
  handleEditSubtask,
  handleSaveSubtaskEdit,
  editingSubtaskIndex,
  editingSubtaskText,
  setEditingSubtaskText,
  handleCancelSubtaskEdit,
  theme
}) => {
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {dialogMode === 'addColumn' ? 'Ajouter une colonne' :
         dialogMode === 'editColumn' ? `Modifier la colonne: ${formValues.columnName}` :
         dialogMode === 'view' ? `Détails de la tâche: ${editingTask?.title || ''}` :
         isEditing ? `Modifier la tâche: ${editingTask?.title || ''}` :
         `Nouvelle tâche dans ${currentColumn || 'À faire'}`}
        <IconButton onClick={onClose} disabled={isCreatingTask}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isCreatingTask && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {kanbanError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {kanbanError}
          </Alert>
        )}
        <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {dialogMode === 'addColumn' || dialogMode === 'editColumn' ? (
            <TextField
              autoFocus
              label="Nom de la colonne"
              variant="outlined"
              fullWidth
              required
              value={formValues.columnName}
              onChange={handleFormChange('columnName')}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
              disabled={isCreatingTask}
              error={!formValues.columnName}
              helperText={!formValues.columnName ? 'Le nom de la colonne est requis' : ''}
            />
          ) : dialogMode === 'view' ? (
            <TaskDetails
              formValues={formValues}
              backlogs={backlogs}
              projectUsers={projectUsers}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getPriorityLabel={getPriorityLabel}
              editingTask={editingTask}
            />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Titre"
                    variant="outlined"
                    fullWidth
                    required
                    value={formValues.title}
                    onChange={handleFormChange('title')}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled={isCreatingTask}
                    error={!formValues.title}
                    helperText={!formValues.title ? 'Le titre est requis' : ''}
                  />
                  <TextField
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={formValues.description}
                    onChange={handleFormChange('description')}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled={isCreatingTask}
                  />
                  <FormControl fullWidth>
                    <InputLabel id="task-priority-label">Priorité</InputLabel>
                    <MuiSelect
                      labelId="task-priority-label"
                      value={formValues.priority}
                      onChange={handleFormChange('priority')}
                      input={<OutlinedInput label="Priorité" />}
                      sx={{ bgcolor: 'white', borderRadius: 1 }}
                      disabled={isCreatingTask}
                    >
                      <MenuItem value="HIGH">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Flag sx={{ color: theme.palette.error.main, mr: 1 }} fontSize="small" />
                          Haute
                        </Box>
                      </MenuItem>
                      <MenuItem value="MEDIUM">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Flag sx={{ color: theme.palette.warning.main, mr: 1 }} fontSize="small" />
                          Moyenne
                        </Box>
                      </MenuItem>
                      <MenuItem value="LOW">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Flag sx={{ color: theme.palette.success.main, mr: 1 }} fontSize="small" />
                          Basse
                        </Box>
                      </MenuItem>
                    </MuiSelect>
                  </FormControl>
                  <Autocomplete
                    options={[{ id: 'none', name: 'Aucun backlog' }, ...(backlogs || [])]}
                    getOptionLabel={(option) => option.name}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Typography variant="body2">{option.name}</Typography>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Backlog associé"
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                      />
                    )}
                    value={
                      formValues.backlogIds.length === 0
                        ? { id: 'none', name: 'Aucun backlog' }
                        : (backlogs || []).find((b) => formValues.backlogIds.includes(b.id)) || { id: 'none', name: 'Aucun backlog' }
                    }
                    onChange={(event, value) => {
                      handleFormChange('backlogIds')(event, value && value.id !== 'none' ? [parseInt(value.id)] : []);
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={isCreatingTask}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Sous-tâches</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Ajouter une sous-tâche"
                        disabled={isCreatingTask}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim() || isCreatingTask}
                      >
                        Ajouter
                      </Button>
                    </Box>
                    <List dense>
                      {subtasks.map((subtask, index) => (
                        <ListItem
                          key={`subtask-${index}`}
                          secondaryAction={
                            <Box>
                              {editingSubtaskIndex === index ? (
                                <>
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleSaveSubtaskEdit(index)}
                                    disabled={!editingSubtaskText.trim() || isCreatingTask}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    edge="end"
                                    onClick={handleCancelSubtaskEdit}
                                    disabled={isCreatingTask}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleEditSubtask(index)}
                                    disabled={isCreatingTask}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleRemoveSubtask(index)}
                                    disabled={isCreatingTask}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          }
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={subtask.completed}
                              onChange={() => handleToggleSubtask(index)}
                              disabled={isCreatingTask || editingSubtaskIndex === index}
                            />
                          </ListItemIcon>
                          {editingSubtaskIndex === index ? (
                            <TextField
                              size="small"
                              value={editingSubtaskText}
                              onChange={(e) => setEditingSubtaskText(e.target.value)}
                              autoFocus
                              fullWidth
                              disabled={isCreatingTask}
                            />
                          ) : (
                            <ListItemText
                              primary={subtask.title}
                              sx={{ textDecoration: subtask.completed ? 'line-through' : 'none' }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Date de début"
                    type="datetime-local"
                    variant="outlined"
                    fullWidth
                    value={formValues.startDate}
                    onChange={handleFormChange('startDate')}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled={isCreatingTask}
                  />
                  <TextField
                    label="Date de fin"
                    type="datetime-local"
                    variant="outlined"
                    fullWidth
                    value={formValues.endDate}
                    onChange={handleFormChange('endDate')}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled={isCreatingTask}
                  />
                  <TextField
                    label="Coût total estimé (DT)"
                    variant="outlined"
                    fullWidth
                    value={(formValues.totalCost ?? 0).toFixed(2)}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled
                  />
                  <InputUserAssignment
                    options={projectUsers}
                    value={formValues.assignedUsers}
                    onChange={(event, value) => handleFormChange('assignedUsers')(event, value)}
                    label="Assigné à"
                    placeholder="Sélectionner des utilisateurs"
                    getAvatarColor={getAvatarColor}
                    generateInitials={generateInitials}
                    disabled={isCreatingTask}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Pièces jointes</Typography>
                    {editingTask?.attachments?.length > 0 && (
                      <List dense>
                        {editingTask.attachments.map((attachment, index) => (
                          <ListItem
                            key={`server-attachment-${index}`}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => window.open(`${attachment.filePath}`, '_blank')}
                                disabled={isCreatingTask}
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
                    )}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFileIcon />}
                      sx={{ mb: 1, borderRadius: 1 }}
                      disabled={isCreatingTask}
                    >
                      Ajouter un fichier
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFormChange('attachments')}
                        accept="image/*,.pdf,.doc,.docx"
                        disabled={isCreatingTask}
                      />
                    </Button>
                    <List dense>
                      {formValues.attachments.map((attachment, index) => (
                        <ListItem
                          key={`file-${index}`}
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveAttachment(`file-${index}`)} disabled={isCreatingTask}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={attachment.name}
                            secondary={`${(attachment.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <StyledButton
          onClick={onClose}
          variant="outlined"
          sx={{ bgcolor: 'white', borderRadius: 1 }}
          disabled={isCreatingTask}
        >
          {dialogMode === 'view' ? 'Fermer' : 'Annuler'}
        </StyledButton>
        {dialogMode !== 'view' && (
          <StyledButton
            onClick={handleFormSubmit}
            variant="contained"
            disabled={isCreatingTask || (dialogMode === 'edit' && !formValues.title) || (dialogMode === 'addColumn' && !formValues.columnName) || (dialogMode === 'editColumn' && !formValues.columnName)}
            sx={{ borderRadius: 1 }}
          >
            {isCreatingTask ? 'Traitement...' : dialogMode === 'addColumn' ? 'Créer' : dialogMode === 'editColumn' ? 'Modifier' : isEditing ? 'Mettre à jour la tâche' : 'Créer la tâche'}
          </StyledButton>
        )}
      </DialogActions>
    </StyledDialog>
  );
};