import React from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';

const UserRoleSection = ({ title, users, getUserDisplayName, getAvatarColor, generateInitials }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Array.isArray(users) && users.length > 0 ? (
          users.map((email) => {
     
            if (!email || typeof email !== 'string') {
              return null;
            }

            const displayName = getUserDisplayName(email) || email.split('@')[0]; 
            const initials = generateInitials(displayName) || '??'; 

            return (
              <Chip
                key={email}
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(displayName),
                      width: 32,
                      height: 32,
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: 'white !important',
                    }}
                  >
                    {initials}
                  </Avatar>
                }
                label={displayName}
                variant="outlined"
                sx={{
                  height: 40,
                  fontSize: '0.9rem',
                  '& .MuiChip-label': {
                    padding: '0 12px',
                  },
                }}
              />
            );
          }).filter(Boolean) 
        ) : (
          <Typography variant="body2" color="textSecondary">
            Aucun {title.toLowerCase()} assigné
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default UserRoleSection;