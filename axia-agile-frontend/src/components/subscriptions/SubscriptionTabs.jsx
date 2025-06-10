import React from 'react';
import { Tabs, Tab } from '@mui/material';

const SubscriptionTabs = ({ activeTab, handleTabChange }) => {
  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      aria-label="subscription tabs"
      sx={{ mb: 3 }}
    >
      <Tab label="Abonnements en Attente" />
      <Tab label="Abonnements Expirés" />
    </Tabs>
  );
};

export default SubscriptionTabs;