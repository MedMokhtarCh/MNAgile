import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  InputAdornment,
} from '@mui/material';
import { VerifiedUser as VerifiedUserIcon, Description as DescriptionIcon } from '@mui/icons-material';

const ClaimForm = ({ open, onClose, claim, setClaim, onSave, isEditMode }) => {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setClaim({ ...claim, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    if (!claim.name.trim()) {
      newErrors.name = 'Le nom du claim est requis';
    }
    // Validate Description to match backend requirement
    if (!claim.description.trim()) {
      newErrors.description = 'La description du claim est requise';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Modifier le claim' : 'Créer un claim'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nom du claim"
              fullWidth
              value={claim.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VerifiedUserIcon />
                  </InputAdornment>
                ),
              }}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={claim.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              required // Mark as required to match backend
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon />
                  </InputAdornment>
                ),
              }}
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClaimForm;