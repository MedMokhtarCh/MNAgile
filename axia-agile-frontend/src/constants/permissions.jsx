import { Folder as FolderIcon, Assignment as AssignmentIcon, BarChart as BarChartIcon, Security as SecurityIcon } from '@mui/icons-material';

// Define permission groups
// Dans permissions.js
export const permissionsGroups = {
  admin: {
    title: 'Administration',
    icon: <SecurityIcon />,
    permissions: [
      { id: 1, label: 'Créer des utilisateurs', description: 'Peut créer des utilisateurs réguliers' },
      { id: 2, label: 'Créer des chefs de projet', description: 'Peut créer des comptes chef de projet' },
      { id: 3, label: 'Créer des projets', description: 'Peut créer des projets' },
      { id: 4, label: 'Modifier des projets', description: 'Peut modifier des projets existants' }
    ]
  }
};

export const allPermissions = Object.values(permissionsGroups).flatMap((group) => group.permissions);

// Function to map frontend permission IDs to backend claim IDs
export const mapFrontendToBackendPermissions = (frontendPermissionIds) => {
  return frontendPermissionIds
    .map((id) => {
      const permission = allPermissions.find((p) => p.id === id);
      return permission ? permission.backendId : null;
    })
    .filter((id) => id !== null);
};

// Function to map backend claim IDs to frontend permission IDs
export const mapBackendToFrontendPermissions = (backendClaimIds) => {
  return backendClaimIds
    .map((id) => {
      const permission = allPermissions.find((p) => p.backendId === id);
      return permission ? permission.id : null;
    })
    .filter((id) => id !== null);
};