import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

const ProfileTabs = ({ activeTab, handleTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
        <Tab label="Informations personnelles" />
        <Tab label="Mot de passe" />
      </Tabs>
    </Box>
  );
};

export default ProfileTabs;