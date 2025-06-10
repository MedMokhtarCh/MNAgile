import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const PasswordSection = ({ handleOpenPasswordDialog }) => {
  return (
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
  );
};

export default PasswordSection;