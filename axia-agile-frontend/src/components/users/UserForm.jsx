// src/components/common/UserForm.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Box
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Person as PersonIcon, Phone as PhoneIcon, AssignmentInd as JobTitleIcon, Business as BusinessIcon, Map as MapIcon } from '@mui/icons-material';
import PermissionForm from '../permissions/PermissionForm';

const UserForm = ({
  open,
  onClose,
  user,
  setUser,
  onSave,
  isEditMode,
  roles,
  permissionsGroups,
  disabledFields = [],
  requiredFields = ['email', 'password'],
  showFields = ['email', 'password'],
}) => {
  const handleChange = (field, value) => {
    setUser({ ...user, [field]: value });
  };

  const handlePermissionChange = (permissionId) => {
    const permissions = user.permissions.includes(permissionId)
      ? user.permissions.filter((id) => id !== permissionId)
      : [...user.permissions, permissionId];
    setUser({ ...user, permissions });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Modifier utilisateur' : 'Créer utilisateur'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {showFields.includes('prenom') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prénom"
                    fullWidth
                    value={user.prenom || ''}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    required={requiredFields.includes('prenom')}
                    disabled={disabledFields.includes('prenom')}
                  />
                </Grid>
              )}
              {showFields.includes('nom') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={user.nom || ''}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    required={requiredFields.includes('nom')}
                    disabled={disabledFields.includes('nom')}
                  />
                </Grid>
              )}
              {showFields.includes('email') && (
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={user.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                    required={requiredFields.includes('email')}
                    disabled={disabledFields.includes('email')}
                  />
                </Grid>
              )}
              {showFields.includes('password') && (
                <Grid item xs={12}>
                  <TextField
                    label={isEditMode ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'}
                    type="password"
                    fullWidth
                    value={user.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment> }}
                    required={requiredFields.includes('password') && !isEditMode}
                    disabled={disabledFields.includes('password')}
                  />
                </Grid>
              )}
              {showFields.includes('telephone') && (
                <Grid item xs={12}>
                  <TextField
                    label="Téléphone"
                    fullWidth
                    value={user.telephone || ''}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                    required={requiredFields.includes('telephone')}
                    disabled={disabledFields.includes('telephone')}
                  />
                </Grid>
              )}
              {showFields.includes('jobTitle') && (
                <Grid item xs={12}>
                  <TextField
                    label="Titre de poste"
                    fullWidth
                    value={user.jobTitle || ''}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><JobTitleIcon /></InputAdornment> }}
                    required={requiredFields.includes('jobTitle')}
                    disabled={disabledFields.includes('jobTitle')}
                  />
                </Grid>
              )}
              {showFields.includes('entreprise') && (
                <Grid item xs={12}>
                  <TextField
                    label="Entreprise"
                    fullWidth
                    value={user.entreprise || ''}
                    onChange={(e) => handleChange('entreprise', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon /></InputAdornment> }}
                    required={requiredFields.includes('entreprise')}
                    disabled={disabledFields.includes('entreprise')}
                  />
                </Grid>
              )}
              {showFields.includes('adresse') && (
                <Grid item xs={12}>
                  <TextField
                    label="Adresse"
                    fullWidth
                    value={user.adresse || ''}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MapIcon /></InputAdornment> }}
                    required={requiredFields.includes('adresse')}
                    disabled={disabledFields.includes('adresse')}
                  />
                </Grid>
              )}
              {showFields.includes('role') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      value={user.role || 'user'}
                      label="Rôle"
                      onChange={(e) => handleChange('role', e.target.value)}
                      disabled={disabledFields.includes('role')}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id} disabled={role.disabled}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {role.icon}
                            <Box sx={{ ml: 1 }}>{role.label}</Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <PermissionForm
              permissionsGroups={permissionsGroups}
              selectedPermissions={user.permissions}
              onPermissionChange={handlePermissionChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Annuler</Button>
        <Button variant="contained" onClick={onSave}>
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;