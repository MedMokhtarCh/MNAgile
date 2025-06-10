import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const PasswordDialog = ({
  open,
  onClose,
  passwordData,
  setPasswordData,
  showPassword,
  setShowPassword,
  handleChangePassword,
  loading,
}) => {
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button onClick={onClose}>Annuler</Button>
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
  );
};

export default PasswordDialog;