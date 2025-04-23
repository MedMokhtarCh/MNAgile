import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import PermissionForm from './PermissionForm';
import { Security as SecurityIcon } from '@mui/icons-material';

const PermissionsModal = ({ open, onClose, user, claims, onSave, onPermissionChange }) => {
  if (!user) return null;

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon />
          <Typography variant="h6">
            Gestion des autorisations pour {user.email}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <PermissionForm
          claims={claims}
          selectedPermissions={user.claimIds || []}
          onPermissionChange={onPermissionChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsModal;