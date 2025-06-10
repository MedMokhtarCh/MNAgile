import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import { Security as SecurityIcon, Close as CloseIcon } from '@mui/icons-material';
import PermissionForm from './PermissionForm';
import { useDispatch } from 'react-redux';
import { updateUserClaims, setSnackbar } from '../../store/slices/usersSlice';

const PermissionsModal = ({ open, onClose, user, claims }) => {
  const dispatch = useDispatch();
  const [localClaimIds, setLocalClaimIds] = useState(user?.claimIds || []);

  // Update local state when user prop changes
  React.useEffect(() => {
    setLocalClaimIds(user?.claimIds || []);
  }, [user]);

  // Handle permission toggle locally
  const handlePermissionChange = (permissionId) => {
    setLocalClaimIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Handle save action
  const handleSave = async () => {
    if (!user || !user.id || !Array.isArray(localClaimIds)) {
      console.error('PermissionsModal - Invalid user data:', user);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Données utilisateur invalides',
          severity: 'error',
        })
      );
      return;
    }

    console.log('PermissionsModal - Saving permissions for user:', user.id, 'with claimIds:', localClaimIds);
    try {
      await dispatch(updateUserClaims({ id: user.id, claimIds: localClaimIds })).unwrap();
      console.log('PermissionsModal - Permissions saved successfully');
      dispatch(
        setSnackbar({
          open: true,
          message: 'Permissions mises à jour avec succès',
          severity: 'success',
        })
      );
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error('PermissionsModal - Error saving permissions:', error);
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la mise à jour des permissions',
          severity: 'error',
        })
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableBackdropClick disableEscapeKeyDown>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon />
            <Typography variant="h6">
              Gestion des autorisations pour {user?.email || 'Utilisateur'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <PermissionForm
          claims={claims}
          selectedPermissions={localClaimIds}
          onPermissionChange={handlePermissionChange}
          userRoleId={user?.roleId}
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