import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, Paper } from '@mui/material';

const PermissionForm = ({ claims, selectedPermissions, onPermissionChange }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Permissions
        </Typography>
        <FormGroup>
          {claims.map((claim) => (
            <FormControlLabel
              key={claim.id}
              control={
                <Checkbox
                  checked={selectedPermissions.includes(claim.id)}
                  onChange={() => onPermissionChange(claim.id)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{claim.label}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {claim.description}
                  </Typography>
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Paper>
    </Box>
  );
};

export default PermissionForm