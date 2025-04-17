import { Person as PersonIcon, SupervisorAccount as ChefProjetIcon, Security as SecurityIcon } from '@mui/icons-material';
import { getStoredData } from './storage';

export const roles = {
  superadmin: {
    id: 'superadmin',
    label: 'Super Administrateur',
    icon: <SecurityIcon />,
    permissions: ['create_users', 'create_project_managers'],
  },
  admin: {
    id: 'admin',
    label: 'Administrateur',
    icon: <SecurityIcon />,
    permissions: [],
  },
  chef_projet: {
    id: 'chef_projet',
    label: 'Chef de Projet',
    icon: <ChefProjetIcon />,
    permissions: ['project_view', 'project_create', 'task_view', 'task_create', 'task_assign'],
  },
  user: {
    id: 'user',
    label: 'Utilisateur',
    icon: <PersonIcon />,
    permissions: ['project_view', 'task_view'],
  },
};

export const getAvailableRoles = (currentUser) => {
  if (currentUser.role === 'superadmin') {
    return [{ ...roles.admin, disabled: false }];
  } else if (currentUser.role === 'admin') {
    const admins = getStoredData('admins');
    const adminData = admins.find((admin) => admin.email === currentUser.email);
    const hasCreateUsers = adminData?.permissions?.includes('create_users') || false;
    const hasCreateProjectManagers = adminData?.permissions?.includes('create_project_managers') || false;
    return [
      { ...roles.user, disabled: !hasCreateUsers },
      { ...roles.chef_projet, disabled: !hasCreateProjectManagers },
    ];
  }
  return [];
};