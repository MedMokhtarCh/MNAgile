import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Modal,
} from '@mui/material';
import {
  Close as CloseIcon,
  CropRotate as CropRotateIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';

const ImageEditorModal = ({
  imageEditorOpen,
  imagePreviewUrl,
  crop,
  setCrop,
  zoom,
  setZoom,
  rotation,
  setRotation,
  onCropComplete,
  handleCancelCrop,
  handleConfirmCrop,
  handleRemoveImage,
}) => {
  return (
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
  );
};

export default ImageEditorModal;