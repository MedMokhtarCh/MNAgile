// src/constants/permissions.jsx
import { Folder as FolderIcon, Assignment as AssignmentIcon, BarChart as BarChartIcon, Security as SecurityIcon } from '@mui/icons-material';

export const permissionsGroups = {
  projects: {
    title: 'Projets',
    icon: <FolderIcon />,
    permissions: [
      { id: 'project_view', label: 'Consulter', description: 'Peut consulter les projets' },
      { id: 'project_create', label: 'Créer', description: 'Peut créer de nouveaux projets' },
      { id: 'project_edit', label: 'Modifier', description: 'Peut modifier les projets existants' },
      { id: 'project_delete', label: 'Supprimer', description: 'Peut supprimer des projets' },
    ],
  },
  tasks: {
    title: 'Tâches',
    icon: <AssignmentIcon />,
    permissions: [
      { id: 'task_view', label: 'Consulter', description: 'Peut consulter les tâches' },
      { id: 'task_create', label: 'Créer', description: 'Peut créer de nouvelles tâches' },
      { id: 'task_edit', label: 'Modifier', description: 'Peut modifier les tâches existantes' },
      { id: 'task_delete', label: 'Supprimer', description: 'Peut supprimer des tâches' },
      { id: 'task_assign', label: 'Assigner', description: 'Peut assigner des tâches aux utilisateurs' },
    ],
  },
  reports: {
    title: 'Rapports',
    icon: <BarChartIcon />,
    permissions: [
      { id: 'report_view', label: 'Consulter', description: 'Peut consulter les rapports' },
      { id: 'report_create', label: 'Créer', description: 'Peut créer de nouveaux rapports' },
      { id: 'report_export', label: 'Exporter', description: 'Peut exporter les rapports' },
    ],
  },
  admin: {
    title: 'Administration',
    icon: <SecurityIcon />,
    permissions: [
      { id: 'create_users', label: 'Créer des utilisateurs', description: 'Peut créer des utilisateurs réguliers' },
      { id: 'create_project_managers', label: 'Créer des chefs de projet', description: 'Peut créer des comptes chef de projet' },
    ],
  },
};

export const allPermissions = Object.values(permissionsGroups).flatMap((group) => group.permissions);