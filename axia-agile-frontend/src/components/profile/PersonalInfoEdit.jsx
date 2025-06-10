import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Box,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const PersonalInfoEdit = ({
  editData,
  handleEditChange,
  toggleEditMode,
  handleSaveProfile,
  loading,
  uploadingPhoto,
}) => {
  return (
    <Card>
      <CardHeader title="Modifier vos informations" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prénom"
              name="firstName"
              value={editData.firstName}
              onChange={handleEditChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nom"
              name="lastName"
              value={editData.lastName}
              onChange={handleEditChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Téléphone"
              name="phoneNumber"
              value={editData.phoneNumber}
              onChange={handleEditChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Titre de poste"
              name="jobTitle"
              value={editData.jobTitle}
              onChange={handleEditChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={toggleEditMode}>
            Annuler
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveProfile}
            startIcon={<SaveIcon />}
            disabled={loading || uploadingPhoto}
          >
            Enregistrer
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoEdit;