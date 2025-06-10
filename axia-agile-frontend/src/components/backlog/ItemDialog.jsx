import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import InputUserAssignment from '../common/InputUserAssignment';
import { FormDialogContent } from './theme';

function ItemDialog({
  open,
  onClose,
  currentItem,
  currentBacklog,
  formValues,
  isSubmitting,
  error,
  projectUsers,
  sprints,
  handleFormChange,
  handleAddSubtask,
  handleSubtaskChange,
  handleRemoveSubtask,
  handleAddItem,
  handleUpdateItem,
  getAvatarColor,
  generateInitials,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentItem ? 'Modifier l\'item' : 'Ajouter un nouvel item'}
        <IconButton
          onClick={onClose}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Titre"
          fullWidth
          variant="outlined"
          value={formValues.title}
          onChange={handleFormChange('title')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
          error={!formValues.title.trim()}
          helperText={!formValues.title.trim() ? 'Le titre est requis' : ''}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formValues.description}
          onChange={handleFormChange('description')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <TextField
          margin="dense"
          label="Date de début"
          type="datetime-local"
          fullWidth
          variant="outlined"
          value={formValues.startDate}
          onChange={handleFormChange('startDate')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <TextField
          margin="dense"
          label="Date de fin"
          type="datetime-local"
          fullWidth
          variant="outlined"
          value={formValues.endDate}
          onChange={handleFormChange('endDate')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <TextField
          margin="dense"
          label="Coût total estimé (DT)"
          fullWidth
          variant="outlined"
          value={(formValues.totalCost ?? 0).toFixed(2)}
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
          disabled
        />
        <InputUserAssignment
          options={projectUsers}
          value={formValues.assignedUsers}
          onChange={(event, newValue) => handleFormChange('assignedUsers')(event, newValue)}
          label="Membres assignés"
          placeholder="Sélectionner des membres"
          getAvatarColor={getAvatarColor}
          generateInitials={generateInitials}
          disabled={isSubmitting}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="priority-label">Priorité</InputLabel>
          <Select
            labelId="priority-label"
            value={formValues.priority}
            onChange={handleFormChange('priority')}
            label="Priorité"
            disabled={isSubmitting}
          >
            <MenuItem value="HIGH">Haute</MenuItem>
            <MenuItem value="MEDIUM">Moyenne</MenuItem>
            <MenuItem value="LOW">Basse</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }} error={!formValues.status}>
          <InputLabel id="status-label">Statut</InputLabel>
          <Select
            labelId="status-label"
            value={formValues.status}
            onChange={handleFormChange('status')}
            label="Statut"
            disabled={isSubmitting}
            required
          >
            <MenuItem value="À faire">À faire</MenuItem>
            {currentItem && formValues.status !== 'À faire' && (
              <>
                <MenuItem value="Terminé">Terminé</MenuItem>
              </>
            )}
          </Select>
          {!formValues.status && (
            <Typography variant="caption" color="error">
              Le statut est requis
            </Typography>
          )}
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="sprint-label">Sprint</InputLabel>
          <Select
            labelId="sprint-label"
            value={formValues.sprintId || ''}
            onChange={handleFormChange('sprintId')}
            label="Sprint"
            disabled={isSubmitting}
          >
            <MenuItem value="">Aucun</MenuItem>
            {sprints.map((sprint) => (
              <MenuItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Sous-tâches
          </Typography>
          {formValues.subtasks.map((subtask, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={subtask}
                onChange={handleSubtaskChange(index)}
                placeholder={`Sous-tâche ${index + 1}`}
                disabled={isSubmitting}
              />
              <IconButton
                onClick={() => handleRemoveSubtask(index)}
                disabled={isSubmitting}
                title="Supprimer la sous-tâche"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSubtask}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          >
            Ajouter une sous-tâche
          </Button>
        </Box>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentItem ? handleUpdateItem : handleAddItem}
          disabled={isSubmitting || !formValues.title.trim() || !formValues.status}
        >
          {isSubmitting ? 'Traitement...' : currentItem ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ItemDialog;