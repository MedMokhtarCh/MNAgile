import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  Grid,
  Container,
  useTheme,
  CircularProgress,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardHeader,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAvatar } from '../hooks/useAvatar';
import {
  fetchProfile,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  setSnackbar,
} from '../store/slices/profileSlice';

// Base URL du ProfileService pour construire les URLs des photos
const PROFILE_SERVICE_BASE_URL = 'https://localhost:7240';

const Profile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { profile, loading, error, snackbar } = useSelector((state) => state.profile);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    jobTitle: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/Login');
      return;
    }

    dispatch(fetchProfile());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile) {
      setEditData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        jobTitle: profile.jobTitle || profile.entreprise || '',
      });
      console.log('Profile updated:', profile);
      console.log('Profile photo URL:', profile.profilePhotoUrl);
    }
  }, [profile]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      setEditData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        jobTitle: profile.jobTitle || profile.entreprise || '',
      });
      setProfileImageFile(null);
    }
  };

  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(editData)).unwrap();
      if (profileImageFile) {
        setUploadingPhoto(true);
        const result = await dispatch(uploadProfilePhoto(profileImageFile)).unwrap();
        console.log('Photo upload result:', result);
        // Refresh profile to ensure latest data
        await dispatch(fetchProfile()).unwrap();
        setUploadingPhoto(false);
      }
      setEditMode(false);
      setProfileImageFile(null);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Profil mis à jour avec succès',
          severity: 'success',
        })
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      setUploadingPhoto(false);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Erreur lors de la sauvegarde du profil',
          severity: 'error',
        })
      );
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(
        setSnackbar({
          open: true,
          message: 'Les mots de passe ne correspondent pas',
          severity: 'error',
        })
      );
      return;
    }

    try {
      await dispatch(updatePassword({ newPassword: passwordData.newPassword })).unwrap();
      handleClosePasswordDialog();
      dispatch(
        setSnackbar({
          open: true,
          message: 'Mot de passe mis à jour avec succès',
          severity: 'success',
        })
      );
    } catch (error) {
      console.error('Error changing password:', error);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Erreur lors de la mise à jour du mot de passe',
          severity: 'error',
        })
      );
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  if (loading && !profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Chargement du profil...</Typography>
        </Box>
      </Container>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return null;
  }

  const fullName = profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.email || 'Utilisateur';

  // Construit l'URL complète de la photo de profil avec cache-busting
  const profilePhotoUrl = profile.profilePhotoUrl
    ? profile.profilePhotoUrl.startsWith('http')
      ? `${profile.profilePhotoUrl}?t=${Date.now()}`
      : `${PROFILE_SERVICE_BASE_URL}${profile.profilePhotoUrl}?t=${Date.now()}`
    : null;

  console.log('Rendering Avatar with URL:', profilePhotoUrl);

  const InfoField = ({ label, value, icon }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      {icon && (
        <Box sx={{ mr: 2, color: 'text.secondary' }}>
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value || '—'}</Typography>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 4, position: 'relative', overflow: 'visible' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', position: 'relative', p: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePhotoUrl}
              sx={{
                width: 100,
                height: 100,
                fontSize: 40,
                bgcolor: getAvatarColor(fullName),
                position: 'relative',
              }}
              imgProps={{
                onError: (e) => {
                  console.error('Error loading profile photo:', profilePhotoUrl);
                  dispatch(
                    setSnackbar({
                      open: true,
                      message: 'Impossible de charger la photo de profil. Vérifiez que le fichier est accessible.',
                      severity: 'error',
                    })
                  );
                  e.target.src = ''; // Force fallback to initials
                },
                onLoad: () => {
                  console.log('Profile photo loaded successfully:', profilePhotoUrl);
                },
              }}
            >
              {uploadingPhoto ? <CircularProgress size={24} /> : generateInitials(fullName)}
            </Avatar>

            {editMode && (
              <label htmlFor="upload-photo">
                <input
                  style={{ display: 'none' }}
                  id="upload-photo"
                  name="upload-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  sx={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.default' },
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            )}
          </Box>

          <Box sx={{ ml: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              {fullName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <EmailIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body1" color="text.secondary">
                {profile.email}
              </Typography>
            </Box>
          </Box>

          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: editMode ? theme.palette.error.light : theme.palette.primary.light,
              color: editMode ? theme.palette.error.contrastText : theme.palette.primary.contrastText,
              '&:hover': {
                bgcolor: editMode ? theme.palette.error.main : theme.palette.primary.main,
              },
            }}
            onClick={toggleEditMode}
          >
            {editMode ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Informations personnelles" />
          <Tab label="Mot de passe" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {!editMode ? (
            <Card>
              <CardHeader title="Informations personnelles" />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <InfoField label="Prénom" value={profile.firstName} icon={<PersonIcon />} />
                    <InfoField label="Nom" value={profile.lastName} icon={<PersonIcon />} />
                    <InfoField label="Email" value={profile.email} icon={<EmailIcon />} />
                    <InfoField label="Téléphone" value={profile.phoneNumber} icon={<PhoneIcon />} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InfoField label="Titre de poste" value={profile.jobTitle} icon={<WorkIcon />} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Sécurité" />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium">
                Mot de passe
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Modifiez votre mot de passe pour sécuriser votre compte.
              </Typography>

              <Button variant="outlined" startIcon={<LockIcon />} onClick={handleOpenPasswordDialog}>
                Changer le mot de passe
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />
          </CardContent>
        </Card>
      )}

      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showPassword.new ? 'text' : 'password'}
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClickShowPassword('new')} edge="end">
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showPassword.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              margin="normal"
              error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
              helperText={
                passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                  ? 'Les mots de passe ne correspondent pas'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClickShowPassword('confirm')} edge="end">
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClosePasswordDialog}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword ||
              loading
            }
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;