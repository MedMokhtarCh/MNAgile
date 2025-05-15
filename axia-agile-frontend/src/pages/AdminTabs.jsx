import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.auth);

  const role = currentUser
    ? currentUser.roleId === 1
      ? 'superadmin'
      : currentUser.roleId === 2
      ? 'admin'
      : null
    : null;

  const tabs = [
    { label: 'Gestion Admins', path: '/AdminManagement', roles: ['superadmin'] },
    { label: 'Gestion Superadmins', path: '/SuperadminManagement', roles: ['superadmin'] },
  ];

  const filteredTabs = tabs.filter((tab) => tab.roles.includes(role));

  const currentTab = filteredTabs.find((tab) => location.pathname === tab.path)
    ? location.pathname
    : filteredTabs[0]?.path || '/AdminManagement';

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  if (!role || filteredTabs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs value={currentTab} onChange={handleChange} aria-label="admin tabs">
        {filteredTabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} value={tab.path} />
        ))}
      </Tabs>
    </Box>
  );
};

export default AdminTabs;