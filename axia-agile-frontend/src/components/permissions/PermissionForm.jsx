import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, Paper } from '@mui/material';

const PermissionForm = ({ permissionsGroups, selectedPermissions, onPermissionChange }) => {
  return (
    <>
      {Object.values(permissionsGroups).map((group) => (
        <Paper key={group.title} variant="outlined" sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
            {group.icon}
            <Box component="span" sx={{ ml: 1 }}>{group.title}</Box>
          </Typography>
          <FormGroup>
            {group.permissions.map((permission) => (
              <FormControlLabel
                key={permission.id}
                control={
                  <Checkbox
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => onPermissionChange(permission.id)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{permission.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Paper>
      ))}
    </>
  );
};

export default PermissionForm;