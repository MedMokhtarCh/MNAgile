import { Avatar, Box, Typography, Chip, Switch, IconButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  SupervisorAccount as ChefProjetIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export const adminColumns = [
  {
    id: 'email',
    label: 'Email',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            mr: 2,
            bgcolor: admin.isActive ? 'primary.main' : 'grey.400',
            color: 'white',
          }}
        >
          {admin.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {admin.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Administrateur
          </Typography>
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
        <Typography variant="body2">{admin.entreprise || 'Non renseigné'}</Typography>
      </Box>
    ),
  },
  {
    id: 'telephone',
    label: 'Téléphone',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">{admin.phoneNumber || 'Non renseigné'}</Typography>
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
          label={`${admin.claimIds?.length || 0} autorisations`}
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
        <Tooltip title={admin.isActive ? 'Désactiver' : 'Activer'}>
          <Switch
            checked={admin.isActive}
            onChange={() => onToggleActive(admin.id)}
            color="secondary"
            inputProps={{ 'aria-label': 'Statut du compte' }}
          />
        </Tooltip>
        <Chip
          icon={admin.isActive ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          label={admin.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={admin.isActive ? 'success' : 'error'}
          sx={{ ml: 1 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    render: (admin, { onEdit, onDelete }) => {
      console.log('Admin in actions column:', admin); // Debug log
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={() => {
                console.log('Edit icon clicked for admin:', admin); // Debug log
                onEdit(admin);
              }}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(admin.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
  },
];

export const userColumns = [
  {
    id: 'user',
    label: 'Utilisateur',
    render: (user, { getAvatarColor }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            mr: 2,
            bgcolor: getAvatarColor(user),
            color: 'white',
          }}
        >
          {user.firstName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseigné'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'role',
    label: 'Rôle',
    render: (user) => (
      <Chip
        icon={user.roleId === 3 ? <ChefProjetIcon /> : <PersonIcon />}
        label={user.roleId === 3 ? 'Chef de Projet' : 'Utilisateur'}
        size="small"
        color={user.roleId === 3 ? 'secondary' : 'primary'}
        sx={{ fontWeight: 'medium' }}
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
        <Typography variant="body2">{user.phoneNumber || 'Non renseigné'}</Typography>
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
          label={`${user.claimIds?.length || 0} autorisations`}
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
        <Tooltip title={user.isActive ? 'Désactiver' : 'Activer'}>
          <Switch
            checked={user.isActive}
            onChange={() => onToggleActive(user.id)}
            color="primary"
            inputProps={{ 'aria-label': 'Statut du compte' }}
          />
        </Tooltip>
        <Chip
          icon={user.isActive ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          label={user.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={user.isActive ? 'success' : 'error'}
          sx={{ ml: 1 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    render: (user, { onEdit, onDelete }) => {
      console.log('User in actions column:', user); // Debug log
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={() => {
                console.log('Edit icon clicked for user:', user); // Debug log
                onEdit(user);
              }}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(user.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
  },
];