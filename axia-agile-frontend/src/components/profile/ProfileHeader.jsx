import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { 
  Email as EmailIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon, 
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { useAvatar } from '../../hooks/useAvatar';

const ProfileHeader = ({
  profile,
  editMode,
  toggleEditMode,
  fullName,
  imagePreviewUrl,
  uploadingPhoto,
  handleImageClick,
  handleImageChange,
  fileInputRef,
  dispatch,
}) => {
  const theme = useTheme();
  const { generateInitials, getAvatarColor } = useAvatar();

  return (
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
  );
};

export default ProfileHeader;