import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { FormDialogContent } from './theme';

function DeleteConfirmationDialog({ open, onClose, title, message, onConfirm, isSubmitting }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle>{title}</DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        <Typography>{message}</Typography>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmationDialog;