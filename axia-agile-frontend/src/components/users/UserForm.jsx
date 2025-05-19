import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
  IconButton,
  CircularProgress, // Add CircularProgress for loading state
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AssignmentInd as JobTitleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PermissionForm from '../permissions/PermissionForm';

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'Security':
      return <SecurityIcon />;
    case 'SupervisorAccount':
      return <SupervisorAccountIcon />;
    case 'Person':
      return <PersonIcon />;
    default:
      return <PersonIcon />;
  }
};

const UserForm = ({
  open,
  onClose,
  user,
  setUser,
  onSave,
  isEditMode,
  roles,
  claims,
  disabledFields = [],
  requiredFields = ['email', 'firstName', 'lastName'],
  showFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'role', 'permissions'],
  loading = false, // Add loading prop
}) => {
  console.log('UserForm - Open:', open, 'User:', user);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    console.log(`UserForm - Changing ${field}:`, value);
    setUser({ ...user, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handlePermissionChange = (permissionId) => {
    console.log('UserForm - Toggling permission:', permissionId);
    const claimIds = user.claimIds.includes(permissionId)
      ? user.claimIds.filter((id) => id !== permissionId)
      : [...user.claimIds, permissionId];
    console.log('UserForm - Updated claimIds:', claimIds);
    setUser({ ...user, claimIds });
  };

  const handleSubmit = async () => {
    console.log('UserForm - Submitting user:', user);
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!user[field] && !(field === 'password' && isEditMode)) {
        newErrors[field] = 'Ce champ est requis';
      }
    });

    if (user.roleId === 2 && !user.entreprise) {
      newErrors.entreprise = "L'entreprise est requise pour les administrateurs";
    }

    if ([3, 4].includes(user.roleId) && !user.jobTitle) {
      newErrors.jobTitle = 'Le titre de poste est requis pour les chefs de projet';
    }

    console.log('UserForm - Validation errors:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave(); // Await the onSave to ensure creation is complete
    } catch (error) {
      console.error('UserForm - Error during submission:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableBackdropClick disableEscapeKeyDown>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span>{isEditMode ? 'Modifier utilisateur' : 'Créer utilisateur'}</span>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={user.roleId === 1 ? 12 : 6}>
            <Grid container spacing={2}>
              {showFields.includes('firstName') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prénom"
                    fullWidth
                    value={user.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required={requiredFields.includes('firstName')}
                    disabled={disabledFields.includes('firstName')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                  />
                </Grid>
              )}
              {showFields.includes('lastName') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={user.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required={requiredFields.includes('lastName')}
                    disabled={disabledFields.includes('lastName')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('email')}
                    disabled={disabledFields.includes('email')}
                    error={!!errors.email}
                    helperText={errors.email}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('password') && !isEditMode}
                    disabled={disabledFields.includes('password')}
                    error={!!errors.password}
                    helperText={errors.password}
                  />
                </Grid>
              )}
              {showFields.includes('phoneNumber') && (
                <Grid item xs={12}>
                  <TextField
                    label="Téléphone"
                    fullWidth
                    value={user.phoneNumber || ''}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('phoneNumber')}
                    disabled={disabledFields.includes('phoneNumber')}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber}
                  />
                </Grid>
              )}
              {showFields.includes('jobTitle') && [3, 4].includes(user.roleId) && (
                <Grid item xs={12}>
                  <TextField
                    label="Titre de poste"
                    fullWidth
                    value={user.jobTitle || ''}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <JobTitleIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('jobTitle')}
                    disabled={disabledFields.includes('jobTitle')}
                    error={!!errors.jobTitle}
                    helperText={errors.jobTitle}
                  />
                </Grid>
              )}
              {showFields.includes('entreprise') && user.roleId === 2 && (
                <Grid item xs={12}>
                  <TextField
                    label="Entreprise"
                    fullWidth
                    value={user.entreprise || ''}
                    onChange={(e) => handleChange('entreprise', e.target.value)}
                    required={requiredFields.includes('entreprise')}
                    disabled={disabledFields.includes('entreprise')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.entreprise}
                    helperText={errors.entreprise}
                  />
                </Grid>
              )}
              {showFields.includes('role') && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.roleId}>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      value={user.roleId || (roles.length > 0 ? roles[0].id : '')}
                      label="Rôle"
                      onChange={(e) => handleChange('roleId', e.target.value)}
                      disabled={disabledFields.includes('role')}
                      sx={{ backgroundColor: disabledFields.includes('role') ? '#f5f5f5' : 'inherit' }}
                    >
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <MenuItem key={role.id} value={role.id} disabled={role.disabled}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getIconComponent(role.iconName)}
                              <Box sx={{ ml: 1 }}>{role.label}</Box>
                            </Box>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          Aucun rôle disponible
                        </MenuItem>
                      )}
                    </Select>
                    {errors.roleId && (
                      <span className="MuiFormHelperText-root Mui-error">{errors.roleId}</span>
                    )}
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Grid>
          {user.roleId !== 1 && showFields.includes('permissions') && (
            <Grid item xs={12} md={6}>
              <PermissionForm
                claims={claims}
                selectedPermissions={Array.isArray(user.claimIds) ? user.claimIds : []}
                onPermissionChange={handlePermissionChange}
                userRoleId={user.roleId}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;