import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
  IconButton,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AssignmentInd as JobTitleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import PermissionForm from '../permissions/PermissionForm';
import { styled, keyframes } from '@mui/system';

// Animation keyframes
const slideInFromTop = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
`;

const StyledTextField = styled(TextField)({
  marginBottom: 16,
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#5B9BD5' },
    },
  },
  '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
  '& .MuiInputLabel-root': { color: '#2c4b6f' },
  '& .MuiInputBase-input': { padding: '12px' },
});

const StyledButton = styled(Button)({
  padding: '12px 0',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
});

const PlanSelector = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
  gap: '12px',
});

const PlanOption = styled(Box)(({ selected }) => ({
  flex: 1,
  padding: '9px',
  border: '2px solid',
  borderColor: selected ? '#1A237E' : '#e0e0e0',
  borderRadius: '8px',
  backgroundColor: selected ? 'rgba(26, 35, 126, 0.05)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: '#5B9BD5',
    transform: 'translateY(-2px)',
  },
}));

const EnhancedAlert = styled(Alert)(({ severity }) => ({
  marginBottom: '16px',
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  animation: `${slideInFromTop} 0.5s ease-out, ${pulse} 2s infinite`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-200px',
    width: '200px',
    height: '100%',
    background:
      severity === 'success'
        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
        : severity === 'error'
        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    animation: `${shimmer} 2s infinite`,
  },
  ...(severity === 'success' && {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white',
    '& .MuiAlert-icon': { color: 'white', fontSize: '24px' },
  }),
  ...(severity === 'error' && {
    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
    color: 'white',
    '& .MuiAlert-icon': { color: 'white', fontSize: '24px' },
  }),
}));

const AlertContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const AlertTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: '1rem',
  marginBottom: '2px',
});

const AlertMessage = styled(Typography)({
  fontSize: '0.9rem',
  opacity: 0.95,
  lineHeight: 1.4,
});

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'Security':
      return <SecurityIcon />;
    case 'SupervisorAccount':
      return <SupervisorAccountIcon />;
    case 'Person':
      return <PersonIcon />;
    default:
      return <PersonIcon />;
  }
};

const getPlanLabel = (plan) => {
  switch (plan) {
    case 'monthly':
      return 'Mensuel';
    case 'quarterly':
      return 'Trimestriel';
    case 'semiannual':
      return 'Semestriel';
    case 'annual':
      return 'Annuel';
    default:
      return 'Non défini';
  }
};

const getPlanBilling = (plan) => {
  switch (plan) {
    case 'monthly':
      return 'Facturation mensuelle';
    case 'quarterly':
      return 'Facturation trimestrielle';
    case 'semiannual':
      return 'Facturation semestrielle';
    case 'annual':
      return 'Facturation annuelle';
    default:
      return '';
  }
};

const getPlanFeature = (plan) => {
  switch (plan) {
    case 'monthly':
      return 'Sans engagement';
    case 'quarterly':
      return 'Option équilibrée';
    case 'semiannual':
      return 'Engagement moyen';
    case 'annual':
      return 'Économie maximale';
    default:
      return '';
  }
};

const UserForm = ({
  open,
  onClose,
  user,
  setUser,
  onSave,
  isEditMode,
  roles,
  claims,
  disabledFields = [],
  requiredFields = ['email', 'firstName', 'lastName'],
  showFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'jobTitle', 'costHour', 'costDay', 'entreprise', 'role', 'permissions', 'subscription'],
  loading = false,
  setLocalAlert,
}) => {
  const [errors, setErrors] = React.useState({});

  useEffect(() => {
    if (!user.subscription || !['monthly', 'quarterly', 'semiannual', 'annual'].includes(user.subscription.plan)) {
      console.log('UserForm - Initializing subscription object');
      setUser({
        ...user,
        subscription: {
          plan: 'annual',
          status: 'Pending',
          startDate: new Date().toISOString(),
          endDate: '',
        },
      });
    }
  }, [user, setUser]);

  const validateForm = () => {
    const newErrors = {};

    if (requiredFields.includes('email') && !user.email) {
      newErrors.email = 'L’adresse email est requise.';
    } else if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      newErrors.email = 'L’adresse email saisie n’est pas valide.';
    }

    if (requiredFields.includes('password') && !isEditMode && !user.password) {
      newErrors.password = 'Le mot de passe est requis.';
    } else if (
      user.password &&
      (user.password.length < 12 ||
        !/[A-Z]/.test(user.password) ||
        !/[a-z]/.test(user.password) ||
        !/[0-9]/.test(user.password) ||
        !/[!@#$%^&*]/.test(user.password))
    ) {
      newErrors.password =
        'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*).';
    }

    if (requiredFields.includes('firstName') && !user.firstName) {
      newErrors.firstName = 'Le prénom est requis.';
    }

    if (requiredFields.includes('lastName') && !user.lastName) {
      newErrors.lastName = 'Le nom est requis.';
    }

    if (requiredFields.includes('phoneNumber') && !user.phoneNumber) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis.';
    } else if (user.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(user.phoneNumber)) {
      newErrors.phoneNumber = 'Le numéro de téléphone doit être au format international (+33123456789).';
    }

    if (requiredFields.includes('jobTitle') && !user.jobTitle) {
      newErrors.jobTitle = 'Le titre de poste est requis.';
    }

    if (requiredFields.includes('costHour') && (!user.costHour || user.costHour <= 0)) {
      newErrors.costHour = 'Le coût horaire doit être un nombre positif.';
    }

    if (requiredFields.includes('costDay') && (!user.costDay || user.costDay <= 0)) {
      newErrors.costDay = 'Le coût journalier doit être un nombre positif.';
    }

    if (requiredFields.includes('entreprise') && user.roleId === 2 && !user.entreprise) {
      newErrors.entreprise = 'L’entreprise est requise pour les administrateurs.';
    }

    if (requiredFields.includes('subscription.plan') && user.roleId === 2) {
      if (!user.subscription || !['monthly', 'quarterly', 'semiannual', 'annual'].includes(user.subscription.plan)) {
        newErrors['subscription.plan'] = 'Le plan d’abonnement est requis.';
      }
    }

    return newErrors;
  };

  const handleChange = (field, value) => {
    console.log(`UserForm - Changing ${field}:`, value);
    setUser({ ...user, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubscriptionPlanChange = (plan) => {
    console.log('UserForm - Changing subscription plan:', plan);
    setUser((prevUser) => ({
      ...prevUser,
      subscription: {
        ...prevUser.subscription,
        plan,
      },
    }));
    if (errors['subscription.plan']) {
      setErrors((prevErrors) => ({ ...prevErrors, 'subscription.plan': null }));
    }
  };

  const handlePermissionChange = (permissionId) => {
    console.log('UserForm - Toggling permission:', permissionId);
    const claimIds = user.claimIds.includes(permissionId)
      ? user.claimIds.filter((id) => id !== permissionId)
      : [...user.claimIds, permissionId];
    setUser({ ...user, claimIds });
  };

  const handleSubmit = async () => {
    console.log('UserForm - Submitting user:', user);
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      setLocalAlert({
        open: true,
        message: firstError,
        severity: 'error',
        title: '🚨 Erreur de validation',
      });
      setTimeout(() => setLocalAlert({ open: false, message: '', severity: 'info', title: '' }), 5000);
      return;
    }

    try {
      await onSave();
      setLocalAlert({
        open: true,
        message: isEditMode ? 'Administrateur modifié avec succès.' : 'Administrateur créé avec succès.',
        severity: 'success',
        title: isEditMode ? '✅ Modification réussie' : '✅ Création réussie',
      });
      setTimeout(() => setLocalAlert({ open: false, message: '', severity: 'info', title: '' }), 3000);
    } catch (error) {
      console.error('UserForm - Error during submission:', error);
      setLocalAlert({
        open: true,
        message: error.message || 'Erreur lors de la soumission.',
        severity: 'error',
        title: '🚨 Erreur',
      });
      setTimeout(() => setLocalAlert({ open: false, message: '', severity: 'info', title: '' }), 5000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableBackdropClick disableEscapeKeyDown>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span>{isEditMode ? 'Modifier utilisateur' : 'Créer utilisateur'}</span>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={user.roleId === 1 ? 12 : 6}>
            <Grid container spacing={2}>
              {showFields.includes('subscription') && user.roleId === 2 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    Plan d'abonnement
                  </Typography>
                  <PlanSelector>
                    {['monthly', 'quarterly', 'semiannual', 'annual'].map((plan) => (
                      <PlanOption
                        key={plan}
                        selected={user.subscription?.plan === plan}
                        onClick={() => !disabledFields.includes('subscription.plan') && handleSubscriptionPlanChange(plan)}
                        sx={{
                          cursor: disabledFields.includes('subscription.plan') ? 'not-allowed' : 'pointer',
                          opacity: disabledFields.includes('subscription.plan') ? 0.7 : 1,
                          pointerEvents: disabledFields.includes('subscription.plan') ? 'none' : 'auto',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600} color="#1A237e">
                          {getPlanLabel(plan)}
                        </Typography>
                        <Typography variant="body2" color="#5c7999" sx={{ my: 0.5 }}>
                          {getPlanBilling(plan)}
                        </Typography>
                        <Typography variant="caption" color="#4CAF50" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                          {getPlanFeature(plan)}
                        </Typography>
                        {disabledFields.includes('subscription.plan') && user.subscription?.plan === plan && (
                          <Typography variant="caption" color="textSecondary"></Typography>
                        )}
                      </PlanOption>
                    ))}
                  </PlanSelector>
                  {errors['subscription.plan'] && (
                    <Typography color="error" variant="caption">
                      {errors['subscription.plan']}
                    </Typography>
                  )}
                </Grid>
              )}
              {showFields.includes('email') && (
                <Grid item xs={12}>
                  <StyledTextField
                    label="Email"
                    fullWidth
                    value={user.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required={requiredFields.includes('email')}
                    disabled={disabledFields.includes('email')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
              )}
              {showFields.includes('password') && (
                <Grid item xs={12}>
                  <StyledTextField
                    label={isEditMode ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'}
                    type="password"
                    fullWidth
                    value={user.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('password') && !isEditMode}
                    disabled={disabledFields.includes('password')}
                    error={!!errors.password}
                    helperText={errors.password}
                  />
                </Grid>
              )}
              {showFields.includes('firstName') && (
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    label="Prénom"
                    fullWidth
                    value={user.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required={requiredFields.includes('firstName')}
                    disabled={disabledFields.includes('firstName')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                  />
                </Grid>
              )}
              {showFields.includes('lastName') && (
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    label="Nom"
                    fullWidth
                    value={user.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required={requiredFields.includes('lastName')}
                    disabled={disabledFields.includes('lastName')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                  />
                </Grid>
              )}
              {showFields.includes('phoneNumber') && (
                <Grid item xs={12}>
                  <StyledTextField
                    label="Téléphone"
                    fullWidth
                    value={user.phoneNumber || ''}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('phoneNumber')}
                    disabled={disabledFields.includes('phoneNumber')}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber}
                  />
                </Grid>
              )}
              {showFields.includes('jobTitle') && (
                <Grid item xs={12}>
                  <StyledTextField
                    label="Titre de poste"
                    fullWidth
                    value={user.jobTitle || ''}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <JobTitleIcon />
                        </InputAdornment>
                      ),
                    }}
                    required={requiredFields.includes('jobTitle')}
                    disabled={disabledFields.includes('jobTitle')}
                    error={!!errors.jobTitle}
                    helperText={errors.jobTitle}
                  />
                </Grid>
              )}
              {showFields.includes('costHour') && (
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    label="Coût horaire"
                    type="number"
                    fullWidth
                    value={user.costHour || ''}
                    onChange={(e) => handleChange('costHour', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    required={requiredFields.includes('costHour')}
                    disabled={disabledFields.includes('costHour')}
                    error={!!errors.costHour}
                    helperText={errors.costHour}
                  />
                </Grid>
              )}
              {showFields.includes('costDay') && (
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    label="Coût journalier"
                    type="number"
                    fullWidth
                    value={user.costDay || ''}
                    onChange={(e) => handleChange('costDay', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    required={requiredFields.includes('costDay')}
                    disabled={disabledFields.includes('costDay')}
                    error={!!errors.costDay}
                    helperText={errors.costDay}
                  />
                </Grid>
              )}
              {showFields.includes('entreprise') && user.roleId === 2 && (
                <Grid item xs={12}>
                  <StyledTextField
                    label="Entreprise"
                    fullWidth
                    value={user.entreprise || ''}
                    onChange={(e) => handleChange('entreprise', e.target.value)}
                    required={requiredFields.includes('entreprise')}
                    disabled={disabledFields.includes('entreprise')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.entreprise}
                    helperText={errors.entreprise}
                  />
                </Grid>
              )}
              {showFields.includes('role') && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.roleId}>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      value={user.roleId || (roles.length > 0 ? roles[0].id : '')}
                      label="Rôle"
                      onChange={(e) => handleChange('roleId', e.target.value)}
                      disabled={disabledFields.includes('role')}
                      sx={{ backgroundColor: disabledFields.includes('role') ? '#f5f5f5' : 'inherit' }}
                    >
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <MenuItem key={role.id} value={role.id} disabled={role.disabled}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getIconComponent(role.iconName)}
                              <Box sx={{ ml: 1 }}>{role.label}</Box>
                            </Box>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          Aucun rôle disponible
                        </MenuItem>
                      )}
                    </Select>
                    {errors.roleId && (
                      <span className="MuiFormHelperText-root Mui-error">{errors.roleId}</span>
                    )}
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Grid>
          {user.roleId !== 1 && showFields.includes('permissions') && (
            <Grid item xs={12} md={6}>
              <PermissionForm
                claims={claims}
                selectedPermissions={Array.isArray(user.claimIds) ? user.claimIds : []}
                onPermissionChange={handlePermissionChange}
                userRoleId={user.roleId}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <StyledButton onClick={onClose} variant="outlined" disabled={loading}>
          Annuler
        </StyledButton>
        <StyledButton
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </StyledButton>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;