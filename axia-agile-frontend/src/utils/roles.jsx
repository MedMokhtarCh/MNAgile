import { AdminPanelSettings as AdminIcon, Person as UserIcon, SupervisorAccount as ChefProjetIcon } from '@mui/icons-material';

export const getAvailableRoles = (currentUser) => {
  const roles = [
    {
      id: 1,
      label: 'Superadmin',
      icon: <AdminIcon />,
      disabled: currentUser?.roleId !== 1, // Only superadmin can assign superadmin
    },
    {
      id: 2,
      label: 'Admin',
      icon: <AdminIcon />,
      disabled: currentUser?.roleId > 2,
    },
    {
      id: 3,
      label: 'Chef de projet',
      icon: <ChefProjetIcon />,
      disabled: currentUser?.roleId > 3,
    },
    {
      id: 4,
      label: 'Utilisateur',
      icon: <UserIcon />,
      disabled: false,
    },
  ];
  return roles.filter((role) => !role.disabled || currentUser?.roleId === role.id);
};