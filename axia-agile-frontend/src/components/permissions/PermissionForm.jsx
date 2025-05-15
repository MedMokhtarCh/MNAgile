import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, Paper } from '@mui/material';

const PermissionForm = ({ claims, selectedPermissions, onPermissionChange, userRoleId }) => {
  console.log('PermissionForm - Claims:', claims);
  console.log('PermissionForm - Selected Permissions:', selectedPermissions);
  console.log('PermissionForm - User Role ID:', userRoleId);

  // Ensure claims and selectedPermissions are safe
  const safeClaims = Array.isArray(claims) ? claims : [];
  const safeSelectedPermissions = Array.isArray(selectedPermissions) ? selectedPermissions : [];

  // Organize claims by category using ‚label‘ field
  const taskClaims = safeClaims.filter(claim => claim && typeof claim.label === 'string' && claim.label.includes('Tasks'));
  const projectClaims = safeClaims.filter(claim => claim && typeof claim.label === 'string' && claim.label.includes('Projects'));
  const userClaims = safeClaims.filter(claim => claim && typeof claim.label === 'string' && claim.label.includes('Users'));
  const extraClaims = safeClaims.filter(
    claim =>
      claim &&
      typeof claim.label === 'string' &&
      !claim.label.includes('Tasks') &&
      !claim.label.includes('Projects') &&
      !claim.label.includes('Users')
  );

  // Define groups with titles and claims
  const groups = [
    { title: 'Gestion des Tâches', claims: taskClaims },
    { title: 'Gestion des Projets', claims: projectClaims },
    { title: 'Gestion des Utilisateurs', claims: userClaims },
    { title: 'Extra', claims: extraClaims },
  ].filter(group => group.claims.length > 0); // Exclude empty groups

  // Handle "Select All" toggle for a group
  const handleSelectAll = (groupClaims, isChecked) => {
    const claimIds = groupClaims.map(claim => claim.id);
    console.log('Select All - Toggling claims:', claimIds, 'to', isChecked ? 'checked' : 'unchecked');
    
    // Toggle each claim in the group
    claimIds.forEach(claimId => {
      const isCurrentlySelected = safeSelectedPermissions.includes(claimId);
      if (isChecked && !isCurrentlySelected) {
        onPermissionChange(claimId); // Add claim
      } else if (!isChecked && isCurrentlySelected) {
        onPermissionChange(claimId); // Remove claim
      }
    });
  };

  // Early return if no valid claims
  if (groups.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}>
          <Typography variant="body1" color="textSecondary">
            Aucune permission disponible
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map(group => {
        // Determine if all claims in the group are selected
        const isGroupChecked = group.claims.every(claim => safeSelectedPermissions.includes(claim.id));
        // Determine if some but not all claims are selected (indeterminate state)
        const isGroupIndeterminate =
          !isGroupChecked && group.claims.some(claim => safeSelectedPermissions.includes(claim.id));

        return (
          <Paper key={group.title} sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}>
            {/* Select All Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isGroupChecked}
                  indeterminate={isGroupIndeterminate}
                  onChange={(e) => {
                    if (userRoleId !== 1) {
                      handleSelectAll(group.claims, e.target.checked);
                    }
                  }}
                  disabled={userRoleId === 1}
                />
              }
              label={
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Sélectionner tout
                </Typography>
              }
              sx={{ mb: 1 }}
            />
            {/* Group Title */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {group.title}
            </Typography>
            <FormGroup>
              {group.claims.map(claim => (
                <FormControlLabel
                  key={claim.id}
                  control={
                    <Checkbox
                      checked={safeSelectedPermissions.includes(claim.id)}
                      onChange={() => {
                        if (userRoleId !== 1) {
                          console.log('Toggling permission:', claim.id);
                          onPermissionChange(claim.id);
                        }
                      }}
                      disabled={userRoleId === 1} // Disable for superadmins
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{claim.label || 'Permission sans nom'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {claim.description || 'Aucune description'}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Paper>
        );
      })}
    </Box>
  );
};

export default PermissionForm;