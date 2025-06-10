import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormDialogContent } from './theme';

const DeleteSprintDialog = ({
  deleteSprintDialogOpen,
  handleCloseDeleteSprintDialog,
  isSubmitting,
  handleDeleteSprint,
}) => (
  <Dialog
    open={deleteSprintDialogOpen}
    onClose={handleCloseDeleteSprintDialog}
    maxWidth="sm"
    fullWidth
    disableBackdropClick
  >
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      Confirmer la suppression du sprint
      <IconButton
        onClick={handleCloseDeleteSprintDialog}
        disabled={isSubmitting}
        title="Fermer"
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <FormDialogContent>
      <Typography variant="body1">
        Êtes-vous sûr de vouloir supprimer ce sprint ? Cette action est irréversible et retirera les tâches associées de ce sprint.
      </Typography>
    </FormDialogContent>
    <DialogActions>
      <Button onClick={handleCloseDeleteSprintDialog} disabled={isSubmitting}>
        Annuler
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={handleDeleteSprint}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Suppression...' : 'Supprimer'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteSprintDialog;