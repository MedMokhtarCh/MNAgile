import React from 'react';
import { Box, Typography } from '@mui/material';

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

export default InfoField;