import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import PermissionForm from './PermissionForm';
import { Security as SecurityIcon } from '@mui/icons-material';

const PermissionsModal = ({ open, onClose, user, permissionsGroups, onSave, onPermissionChange }) => {
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Gestion des autorisations pour {user.email}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <PermissionForm
          permissionsGroups={permissionsGroups}
          selectedPermissions={user.permissions}
          onPermissionChange={onPermissionChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Annuler</Button>
        <Button variant="contained" onClick={onSave}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsModal;