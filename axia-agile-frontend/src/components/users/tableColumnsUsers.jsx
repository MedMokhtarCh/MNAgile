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
  Subscriptions as SubscriptionIcon,
} from '@mui/icons-material';

// Helper function to format subscription plan
const formatSubscriptionPlan = (plan) => {
  if (!plan) return 'Non défini';
  
  const plans = {
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    semiannual: 'Semestriel',
    annual: 'Annuel',
  };
  
  return plans[plan.toLowerCase()] || 'Non défini';
};

const formatSubscriptionStatus = (status) => {
  if (!status) return 'Inconnu';
  
  const statuses = {
    active: 'Validé',
    pending: 'En attente',
    expired: 'Expiré',
    rejected: 'Rejeté',
  };
  
  return statuses[status.toLowerCase()] || 'Inconnu';
};

// Helper function to get subscription status color
const getSubscriptionStatusColor = (status) => {
  if (!status) return 'default';
  const normalizedStatus = status.toLowerCase().trim();
  switch (normalizedStatus) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'expired':
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

// Helper function to format dates
const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('fr-FR') : 'N/A';
};

export const adminColumns = [
  {
    id: 'email',
    label: 'Email',
    width: '25%',
    minWidth: '140px',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            mr: 1,
            bgcolor: admin.isActive ? 'primary.main' : 'grey.400',
            color: 'white',
            width: 30,
            height: 30,
            fontSize: '0.75rem',
          }}
        >
          {admin.email?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
            {admin.email || 'Non renseigné'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Admin
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    width: '15%',
    minWidth: '100px',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BusinessIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {admin.entreprise || 'Non renseigné'}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'telephone',
    label: 'Téléphone',
    width: '15%',
    minWidth: '100px',
    render: (admin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {admin.phoneNumber || 'Non renseigné'}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'subscription',
    label: 'Abonnement',
    width: '20%',
    minWidth: '120px',
    render: (admin) => {
      if (!admin.subscription) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SubscriptionIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Chip
              label="Aucun"
              size="small"
              color="default"
              sx={{ fontWeight: 'medium', fontSize: '0.75rem', py: 0.5 }}
            />
          </Box>
        );
      }
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SubscriptionIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Tooltip
            title={`Plan: ${formatSubscriptionPlan(admin.subscription.plan)} | Statut: ${formatSubscriptionStatus(
              admin.subscription.status
            )} | Début: ${formatDate(admin.subscription.startDate)} | Fin: ${formatDate(admin.subscription.endDate)}`}
          >
            <Chip
              label={`${formatSubscriptionPlan(admin.subscription.plan)} - ${formatSubscriptionStatus(
                admin.subscription.status
              )}`}
              size="small"
              color={getSubscriptionStatusColor(admin.subscription.status)}
              sx={{ fontWeight: 'medium', fontSize: '0.75rem', py: 0.5 }}
            />
          </Tooltip>
        </Box>
      );
    },
  },
  {
    id: 'permissions',
    label: 'Autorisations',
    width: '15%',
    minWidth: '100px',
    render: (admin, { onManagePermissions = () => {} }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Chip
          label={`${Array.isArray(admin.claimIds) ? admin.claimIds.length : 0} autorisations`}
          size="small"
          color="info"
          onClick={() => onManagePermissions(admin)}
          sx={{ cursor: 'pointer', fontSize: '0.7rem', py: 0.4 }} // Reduced font size and padding
          aria-label={`Gérer les autorisations pour ${admin.email || 'cet administrateur'}`}
        />
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Statut',
    width: '15%',
    minWidth: '100px',
    render: (admin, { onToggleActive = () => {} }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={admin.isActive ? 'Désactiver' : 'Activer'}>
          <Switch
            checked={!!admin.isActive}
            onChange={() => onToggleActive(admin.id)}
            color="secondary"
            size="small"
            inputProps={{ 'aria-label': `Statut de ${admin.email || 'l\'administrateur'}` }}
          />
        </Tooltip>
        <Chip
          icon={admin.isActive ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          label={admin.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={admin.isActive ? 'success' : 'error'}
          sx={{ ml: 0.5, fontSize: '0.75rem', py: 0.5 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    width: '10%',
    minWidth: '80px',
    render: (admin, { onEdit = () => {}, onDelete = () => {} }) => (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Modifier">
          <IconButton
            size="small"
            sx={{ mr: 0.5 }}
            onClick={() => onEdit(admin)}
            color="primary"
            aria-label={`Modifier ${admin.email || 'cet administrateur'}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(admin.id)}
            aria-label={`Supprimer ${admin.email || 'cet administrateur'}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

export const userColumns = [
  {
    id: 'user',
    label: 'Utilisateur',
    width: '25%',
    minWidth: '140px',
    render: (user, { getAvatarColor = () => 'grey.400' }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            mr: 1,
            bgcolor: getAvatarColor(user),
            color: 'white',
            width: 24,
            height: 24,
            fontSize: '0.75rem',
          }}
        >
          {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseigné'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {user.email || 'Non renseigné'}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'role',
    label: 'Rôle',
    width: '15%',
    minWidth: '100px',
    render: (user) => (
      <Chip
        icon={user.roleId === 3 ? <ChefProjetIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
        label={user.roleId === 3 ? 'Chef de Projet' : 'Utilisateur'}
        size="small"
        color={user.roleId === 3 ? 'secondary' : 'primary'}
        sx={{ fontWeight: 'medium', fontSize: '0.75rem', py: 0.5 }}
        aria-label={`Rôle: ${user.roleId === 3 ? 'Chef de Projet' : 'Utilisateur'}`}
      />
    ),
  },
  {
    id: 'jobTitle',
    label: 'Poste',
    width: '15%',
    minWidth: '100px',
    render: (user) => (
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        {user.jobTitle || 'Non renseigné'}
      </Typography>
    ),
  },
  {
    id: 'telephone',
    label: 'Contact',
    width: '15%',
    minWidth: '100px',
    render: (user) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {user.phoneNumber || 'Non renseigné'}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'permissions',
    label: 'Autorisations',
    width: '15%',
    minWidth: '100px',
    render: (user, { onManagePermissions = () => {} }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Chip
          label={`${Array.isArray(user.claimIds) ? user.claimIds.length : 0} autorisations`}
          size="small"
          color="info"
          onClick={() => onManagePermissions(user)}
          sx={{ cursor: 'pointer', fontSize: '0.7rem', py: 0.4 }} // Reduced font size and padding
          aria-label={`Gérer les autorisations pour ${user.email || 'cet utilisateur'}`}
        />
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Statut',
    width: '15%',
    minWidth: '100px',
    render: (user, { onToggleActive = () => {} }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={user.isActive ? 'Désactiver' : 'Activer'}>
          <Switch
            checked={!!user.isActive}
            onChange={() => onToggleActive(user.id)}
            color="primary"
            size="small"
            inputProps={{ 'aria-label': `Statut de ${user.email || 'l\'utilisateur'}` }}
          />
        </Tooltip>
        <Chip
          icon={user.isActive ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          label={user.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={user.isActive ? 'success' : 'error'}
          sx={{ ml: 0.5, fontSize: '0.75rem', py: 0.5 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    width: '10%',
    minWidth: '80px',
    render: (user, { onEdit = () => {}, onDelete = () => {} }) => (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Modifier">
          <IconButton
            size="small"
            sx={{ mr: 0.5 }}
            onClick={() => onEdit(user)}
            color="primary"
            aria-label={`Modifier ${user.email || 'cet utilisateur'}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(user.id)}
            aria-label={`Supprimer ${user.email || 'cet utilisateur'}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

export const superadminColumns = [
  {
    id: 'email',
    label: 'Email',
    width: '35%',
    minWidth: '140px',
    render: (superadmin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            mr: 1,
            bgcolor: superadmin.isActive ? 'primary.main' : 'grey.400',
            color: 'white',
            width: 24,
            height: 24,
            fontSize: '0.75rem',
          }}
        >
          {superadmin.email?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
            {superadmin.email || 'Non renseigné'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Superadmin
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'telephone',
    label: 'Téléphone',
    width: '30%',
    minWidth: '100px',
    render: (superadmin) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {superadmin.phoneNumber || 'Non renseigné'}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Statut',
    width: '25%',
    minWidth: '100px',
    render: (superadmin, { onToggleActive = () => {} }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={superadmin.isActive ? 'Désactiver' : 'Activer'}>
          <Switch
            checked={!!superadmin.isActive}
            onChange={() => onToggleActive(superadmin.id)}
            color="secondary"
            size="small"
            inputProps={{ 'aria-label': `Statut de ${superadmin.email || 'le superadministrateur'}` }}
          />
        </Tooltip>
        <Chip
          icon={superadmin.isActive ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          label={superadmin.isActive ? 'Actif' : 'Inactif'}
          size="small"
          color={superadmin.isActive ? 'success' : 'error'}
          sx={{ ml: 0.5, fontSize: '0.75rem', py: 0.5 }}
        />
      </Box>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    width: '10%',
    minWidth: '80px',
    render: (superadmin, { onEdit = () => {}, onDelete = () => {} }) => (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Modifier">
          <IconButton
            size="small"
            sx={{ mr: 0.5 }}
            onClick={() => onEdit(superadmin)}
            color="primary"
            aria-label={`Modifier ${superadmin.email || 'ce superadministrateur'}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(superadmin.id)}
            aria-label={`Supprimer ${superadmin.email || 'ce superadministrateur'}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];