import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormDialogContent } from './theme';

function SprintDialog({
  open,
  onClose,
  currentSprint,
  formValues,
  isSubmitting,
  error,
  handleFormChange,
  handleCreateSprint,
  handleUpdateSprint,
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
        {currentSprint ? 'Modifier le sprint' : 'Créer un nouveau sprint'}
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
          label="Nom du sprint"
          fullWidth
          variant="outlined"
          value={formValues.name}
          onChange={handleFormChange('name')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
          error={!formValues.name.trim()}
          helperText={!formValues.name.trim() ? 'Le nom est requis' : ''}
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
          type="date"
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
          type="date"
          fullWidth
          variant="outlined"
          value={formValues.endDate}
          onChange={handleFormChange('endDate')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
      </FormDialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentSprint ? handleUpdateSprint : handleCreateSprint}
          disabled={isSubmitting || !formValues.name.trim()}
        >
          {isSubmitting ? 'Traitement...' : currentSprint ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SprintDialog;