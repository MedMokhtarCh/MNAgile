import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Snackbar,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from '@mui/material';
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
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoView from '../components/profile/PersonalInfoView';
import PersonalInfoEdit from '../components/profile/PersonalInfoEdit';
import PasswordSection from '../components/profile/PasswordSection';
import PasswordDialog from '../components/profile/PasswordDialog';
import ImageEditorModal from '../components/profile/ImageEditorModal';

const PROFILE_SERVICE_BASE_URL = 'http://localhost:5289';

const Profile = () => {
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
      setPasswordDialogOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
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

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

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

    return canvas.toDataURL('image/jpeg');
  };

  const handleConfirmCrop = async () => {
    try {
      const croppedImageUrl = await createCroppedImage();
      setImagePreviewUrl(croppedImageUrl);

      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader
        profile={profile}
        editMode={editMode}
        toggleEditMode={() => setEditMode(!editMode)}
        fullName={fullName}
        imagePreviewUrl={imagePreviewUrl}
        uploadingPhoto={uploadingPhoto}
        handleImageClick={handleImageClick}
        handleImageChange={handleImageChange}
        fileInputRef={fileInputRef}
        dispatch={dispatch}
      />

      <ProfileTabs activeTab={activeTab} handleTabChange={handleTabChange} />

      {activeTab === 0 && (
        <Box>
          {!editMode ? (
            <PersonalInfoView profile={profile} />
          ) : (
            <PersonalInfoEdit
              editData={editData}
              handleEditChange={handleEditChange}
              toggleEditMode={() => setEditMode(!editMode)}
              handleSaveProfile={handleSaveProfile}
              loading={loading}
              uploadingPhoto={uploadingPhoto}
            />
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <PasswordSection handleOpenPasswordDialog={() => setPasswordDialogOpen(true)} />
      )}

      <PasswordDialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordData({ newPassword: '', confirmPassword: '' });
        }}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleChangePassword={handleChangePassword}
        loading={loading}
      />

      <ImageEditorModal
        imageEditorOpen={imageEditorOpen}
        imagePreviewUrl={imagePreviewUrl}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        rotation={rotation}
        setRotation={setRotation}
        onCropComplete={onCropComplete}
        handleCancelCrop={handleCancelCrop}
        handleConfirmCrop={handleConfirmCrop}
        handleRemoveImage={handleRemoveImage}
      />

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