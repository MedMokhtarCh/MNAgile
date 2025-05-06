import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Cancel as CancelIcon,
  CropRotate as CropRotateIcon,
  Close as CloseIcon,
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
import Cropper from 'react-easy-crop'; 

const PROFILE_SERVICE_BASE_URL = 'http://localhost:5289';

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
  
  // État pour l'éditeur d'image
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const fileInputRef = useRef(null);

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
      
      if (profile.profilePhotoUrl) {
        const completePhotoUrl = profile.profilePhotoUrl.startsWith('http')
          ? `${profile.profilePhotoUrl}?t=${Date.now()}`
          : `${PROFILE_SERVICE_BASE_URL}${profile.profilePhotoUrl}?t=${Date.now()}`;
        setImagePreviewUrl(completePhotoUrl);
      }
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
      setImagePreviewUrl(
        profile.profilePhotoUrl
          ? profile.profilePhotoUrl.startsWith('http')
            ? `${profile.profilePhotoUrl}?t=${Date.now()}`
            : `${PROFILE_SERVICE_BASE_URL}${profile.profilePhotoUrl}?t=${Date.now()}`
          : null
      );
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
        await dispatch(uploadProfilePhoto(profileImageFile)).unwrap();
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

  const handleImageClick = () => {
    if (editMode) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setImagePreviewUrl(reader.result);
        setImageEditorOpen(true);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixelsData) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  };

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = imagePreviewUrl;
    
    await new Promise(resolve => {
      img.onload = resolve;
    });
    
    // Dimensions du canvas
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    
    // Appliquer rotation et recadrage
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    
    // Convertir en base64
    return canvas.toDataURL('image/jpeg');
  };

  const handleConfirmCrop = async () => {
    try {
      const croppedImageUrl = await createCroppedImage();
      setImagePreviewUrl(croppedImageUrl);
      
      // Convertir l'image base64 en fichier pour l'envoi
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      
      setProfileImageFile(croppedFile);
      setImageEditorOpen(false);
    } catch (error) {
      console.error('Error cropping image:', error);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Erreur lors du recadrage de l\'image',
          severity: 'error',
        })
      );
    }
  };

  const handleCancelCrop = () => {
    if (!profile.profilePhotoUrl) {
      setImagePreviewUrl(null);
    } else {
      setImagePreviewUrl(
        profile.profilePhotoUrl.startsWith('http')
          ? `${profile.profilePhotoUrl}?t=${Date.now()}`
          : `${PROFILE_SERVICE_BASE_URL}${profile.profilePhotoUrl}?t=${Date.now()}`
      );
    }
    setImageEditorOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreviewUrl(null);
    setProfileImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              src={imagePreviewUrl}
              sx={{
                width: 100,
                height: 100,
                fontSize: 40,
                bgcolor: getAvatarColor(fullName),
                position: 'relative',
                cursor: editMode ? 'pointer' : 'default',
              }}
              imgProps={{
                onError: (e) => {
                  console.error('Error loading profile photo:', imagePreviewUrl);
                  dispatch(
                    setSnackbar({
                      open: true,
                      message: 'Impossible de charger la photo de profil.',
                      severity: 'error',
                    })
                  );
                  e.target.src = ''; // Force fallback to initials
                },
              }}
              onClick={handleImageClick}
            >
              {uploadingPhoto ? <CircularProgress size={24} /> : generateInitials(fullName)}
            </Avatar>

            {editMode && (
              <>
                <input
                  style={{ display: 'none' }}
                  ref={fileInputRef}
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
                  onClick={() => fileInputRef.current.click()}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </>
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
        // Le reste du code reste identique...
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

      {/* Dialogue pour le mot de passe (inchangé) */}
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

      {/* Modal pour l'éditeur d'image */}
      <Modal
        open={imageEditorOpen}
        onClose={handleCancelCrop}
        aria-labelledby="image-editor-modal"
        aria-describedby="edit-profile-image"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '60%' },
            maxWidth: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Modifier votre photo de profil
            </Typography>
            <IconButton onClick={handleCancelCrop} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ position: 'relative', height: 300, mb: 3, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
            <Cropper
              image={imagePreviewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              rotation={rotation}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Zoom
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                1x
              </Typography>
              <Box sx={{ flexGrow: 1, mx: 2 }}>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                3x
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Rotation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                0°
              </Typography>
              <Box sx={{ flexGrow: 1, mx: 2 }}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                360°
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleCancelCrop} color="inherit">
              Annuler
            </Button>
            <Box>
              <Button onClick={handleRemoveImage} color="error" sx={{ mr: 1 }}>
                Supprimer
              </Button>
              <Button onClick={handleConfirmCrop} variant="contained" color="primary" startIcon={<CropRotateIcon />}>
                Appliquer
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

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