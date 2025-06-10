import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, IconButton,Box  } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormDialogContent } from './theme';

function BacklogDialog({
  open,
  onClose,
  currentBacklog,
  formValues,
  isSubmitting,
  error,
  handleFormChange,
  handleAddBacklog,
  handleUpdateBacklog,
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
        {currentBacklog ? 'Modifier le backlog' : 'Créer un nouveau backlog'}
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
          label="Nom du backlog"
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
          disabled={isSubmitting}
        />
      </FormDialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentBacklog ? handleUpdateBacklog : handleAddBacklog}
          disabled={isSubmitting || !formValues.name.trim()}
        >
          {isSubmitting ? 'Traitement...' : currentBacklog ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BacklogDialog;