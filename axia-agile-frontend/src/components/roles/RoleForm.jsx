import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

const RoleForm = ({ open, onClose, role, setRole, onSave, isEditMode, existingRoles, currentUserId }) => {
  const [errors, setErrors] = useState({});
  const [isDefaultRole, setIsDefaultRole] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && role.id && DEFAULT_ROLE_IDS.includes(role.id)) {
      setIsDefaultRole(true);
    } else {
      setIsDefaultRole(false);
    }
  }, [isEditMode, role.id]);

  const handleChange = (field, value) => {
    setRole({ ...role, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!role.name || !role.name.trim()) {
      newErrors.name = 'Le nom du rôle est requis';
    } else if (
      existingRoles.some(
        (r) =>
          r.label.toLowerCase() === role.name.trim().toLowerCase() &&
          (!isEditMode || r.id !== role.id) &&
          (DEFAULT_ROLE_IDS.includes(r.id) || r.createdByUserId === currentUserId)
      )
    ) {
      newErrors.name = 'Un rôle avec ce nom existe déjà';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSave();
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = () => {
    if (isEditMode && role.id) {
      if (role.id === 1 || role.id === 2) return <SecurityIcon StuIcon fontSize="large" />;
      if (role.id === 3) return <SupervisorAccountIcon fontSize="large" />;
      return <PersonIcon fontSize="large" />;
    }
    return <PersonIcon fontSize="large" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Modifier le rôle' : 'Créer un rôle'}
        {isDefaultRole && (
          <Tooltip title="Ce rôle est utilisé par le système et ne peut pas être modifié">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon color="warning" />
            </IconButton>
          </Tooltip>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isDefaultRole ? (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2">
              Ce rôle est un rôle système par défaut et ne peut pas être modifié car il est 
              utilisé dans les routes de l'application et peut influencer son fonctionnement.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box mr={2}>{getRoleIcon()}</Box>
                <Typography variant="body2">
                  {isEditMode ? 'Modifiez les informations du rôle' : 'Créez un nouveau rôle'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nom du rôle"
                fullWidth
                value={role.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={isDefaultRole || submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentIcon />
                    </InputAdornment>
                  ),
                }}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          Annuler
        </Button>
        {!isDefaultRole ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            color="primary"
            disabled={submitting}
          >
            {isEditMode ? 'Enregistrer' : 'Créer'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onClose} color="primary" disabled={submitting}>
            Fermer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RoleForm;