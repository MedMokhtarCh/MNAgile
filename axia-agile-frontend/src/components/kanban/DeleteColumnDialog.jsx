// components/kanban/DeleteColumnDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';
import { StyledButton } from '../kanban/theme';

export const DeleteColumnDialog = ({ 
  open, 
  onClose, 
  onConfirm 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
        Confirmer la suppression de la colonne
      </DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir supprimer cette colonne ? Toutes les tâches associées seront également supprimées.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <StyledButton
          onClick={onClose}
          variant="outlined"
          sx={{ bgcolor: 'white', borderRadius: 1 }}
        >
          Annuler
        </StyledButton>
        <StyledButton
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ borderRadius: 1 }}
        >
          Supprimer
        </StyledButton>
      </DialogActions>
    </Dialog>
  );
};