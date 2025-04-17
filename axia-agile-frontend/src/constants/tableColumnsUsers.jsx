import { Avatar, Box, Typography, Chip, Switch, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, SupervisorAccount as ChefProjetIcon, Security as SecurityIcon, Business as BusinessIcon, Map as MapIcon, Phone as PhoneIcon } from '@mui/icons-material';

export const adminColumns = [
  {
    id: 'email',
    label: 'Email',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2, bgcolor: admin.isActive ? 'primary.main' : 'grey.400' }}>
          {admin.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2">{admin.email}</Typography>
          <Typography variant="caption" color="text.secondary">Admin</Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">{admin.entreprise}</Typography>
      </Box>
    ),
  },
  {
    id: 'adresse',
    label: 'Adresse',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <MapIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {admin.adresse}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'telephone',
    label: 'Téléphone',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">{admin.telephone}</Typography>
      </Box>
    ),
  },
  {
    id: 'permissions',
    label: 'Autorisations',
    render: (admin, { onManagePermissions }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Chip
          label={`${admin.permissions.length} autorisations`}
          size="small"
          color="info"
          onClick={() => onManagePermissions(admin)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Statut',
    render: (admin, { onToggleActive }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Switch
          checked={admin.isActive}
          onChange={() => onToggleActive(admin.id)}
          color="secondary"
        />
        <Chip
          label={admin.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={admin.isActive ? 'success' : 'default'}
          sx={{ ml: 1 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    render: (admin, { onEdit, onDelete }) => (
      <>
        <Tooltip title="Modifier">
          <IconButton size="small" sx={{ mr: 1 }} onClick={() => onEdit(admin.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" color="error" onClick={() => onDelete(admin.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    ),
  },
];

export const userColumns = [
  {
    id: 'user',
    label: 'Utilisateur',
    render: (user, { getAvatarColor }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2, bgcolor: getAvatarColor(user) }}>
          {user.prenom?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2">{`${user.prenom || ''} ${user.nom || ''}`}</Typography>
          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'role',
    label: 'Rôle',
    render: (user) => (
      <Chip
        icon={user.role === 'chef_projet' ? <ChefProjetIcon /> : <PersonIcon />}
        label={user.role === 'chef_projet' ? 'Chef de Projet' : 'Utilisateur'}
        size="small"
        color={user.role === 'chef_projet' ? 'secondary' : 'primary'}
      />
    ),
  },
  {
    id: 'jobTitle',
    label: 'Titre de poste',
    render: (user) => <Typography variant="body2">{user.jobTitle || 'Non renseigné'}</Typography>,
  },
  {
    id: 'telephone',
    label: 'Contact',
    render: (user) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">{user.telephone || 'Non renseigné'}</Typography>
      </Box>
    ),
  },
  {
    id: 'permissions',
    label: 'Autorisations',
    render: (user, { onManagePermissions }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Chip
          label={`${user.permissions.length} autorisations`}
          size="small"
          color="info"
          onClick={() => onManagePermissions(user)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Statut',
    render: (user, { onToggleActive }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Switch
          checked={user.isActive}
          onChange={() => onToggleActive(user.id)}
          color="success"
        />
        <Chip
          label={user.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={user.isActive ? 'success' : 'default'}
          sx={{ ml: 1 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    render: (user, { onEdit, onDelete }) => (
      <>
        <Tooltip title="Modifier">
          <IconButton size="small" sx={{ mr: 1 }} onClick={() => onEdit(user.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" color="error" onClick={() => onDelete(user.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    ),
  },
];