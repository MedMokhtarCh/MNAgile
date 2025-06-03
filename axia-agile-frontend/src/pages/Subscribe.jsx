import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button, TextField, Alert, Typography, Box, IconButton, Grid, Fade
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { styled, keyframes } from '@mui/system';
import logo from '../assets/logo.png';
import heroImage from '../assets/hero.png';
import { signup, setSnackbar, clearUserExists } from '../store/slices/usersSlice';

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

const AuthContainer = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  overflow: 'hidden',
  position: 'relative',
});

const BackButton = styled(IconButton)({
  position: 'fixed',
  top: 20,
  left: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  zIndex: 10,
});

const FormSide = styled(Box)({
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  backgroundColor: '#fff',
  overflowY: 'auto', 
  minHeight: '100vh', 
  scrollbarWidth: 'none', 
  '&::-webkit-scrollbar': { display: 'none' }, 
  msOverflowStyle: 'none', 
});


const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: 30,
});

const FormContainer = styled(Box)({
  width: '480px',
  maxWidth: '90%',
  paddingBottom: '40px', 
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

const StyledTextField = styled(TextField)({
  marginBottom: 16,
  '& .MuiOutlinedInput-root': { 
    borderRadius: 8, 
    '&:hover': { 
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#5B9BD5' } 
    } 
  },
  '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
  '& .MuiInputLabel-root': { color: '#2c4b6f' },
  '& .MuiInputBase-input': { padding: '12px' },
});

const HeroSide = styled(Box)({
  width: '44%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: '#EBF5FB',
  color: '#1A237E',
  padding: '40px',
  position: 'fixed',
  right: 0,
  top: 0,
  bottom: 0,
  overflow: 'hidden',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  msOverflowStyle: 'none',
});

const HeroTitle = styled(Typography)({
  color: '#1A237E',
  textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: '20px',
});

const HeroImageContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexGrow: 1,
  padding: '10px 0',
  height: 'calc(100vh - 300px)',
  minHeight: '300px',
});

const HeroImg = styled('img')({
  maxWidth: '85%',
  maxHeight: '100%',
  objectFit: 'contain',
  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15))',
});

const HeroFooter = styled(Box)({
  textAlign: 'center',
  padding: '10px 0',
});

const FormTitle = styled(Typography)({
  fontWeight: 700,
  color: '#1A237E',
  marginBottom: '5px',
  fontSize: '1.8rem',
});

const FormSubtitle = styled(Typography)({
  color: '#5c7999',
  fontWeight: 500,
  marginBottom: '20px',
  fontSize: '0.95rem',
});

const InputLabel = styled(Typography)({
  fontWeight: 600,
  color: '#2c4b6f',
  marginBottom: '4px',
  fontSize: '0.95rem',
});

const PlanSelector = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
  gap: '12px',
});

const PlanOption = styled(Box)(({ selected }) => ({
  flex: 1,
  padding: '12px',
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
    background: severity === 'success' 
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
      : severity === 'error'
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    animation: `${shimmer} 2s infinite`,
  },
  ...(severity === 'success' && {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'error' && {
    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'warning' && {
    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'info' && {
    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
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

const Subscribe = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    entreprise: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [localAlert, setLocalAlert] = useState({ open: false, message: '', severity: 'info', title: '' });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { usersLoading, snackbar } = useSelector((state) => state.users);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localAlert.open) {
      setLocalAlert({ ...localAlert, open: false });
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const showEnhancedAlert = (message, severity, title = '') => {
    const alertTitles = {
      error: '❌ Erreur de validation',
      success: '✅ Inscription réussie !',
      warning: '⚠️ Attention requis',
      info: 'ℹ️ Information'
    };

    setLocalAlert({
      open: true,
      message,
      severity,
      title: title || alertTitles[severity] || 'Notification'
    });

    setTimeout(() => {
      setLocalAlert(prev => ({ ...prev, open: false }));
    }, severity === 'error' ? 6000 : 4000);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.entreprise) {
      return {
        message: 'Tous les champs sont obligatoires pour créer votre compte professionnel.',
        severity: 'error'
      };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        message: 'Veuillez entrer une adresse email valide (exemple@gmail.com).',
        severity: 'error'
      };
    }
    
    if (formData.password.length < 12 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) {
      return {
        message: 'Le mot de passe doit contenir au moins 12 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*).',
        severity: 'error'
      };
    }
    
    const phoneRegex = /^\+?[1-8]\d{1,14}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      return {
        message: 'Veuillez entrer un numéro de téléphone valide .',
        severity: 'error'
      };
    }
    
    if (formData.entreprise.trim().length === 0) {
      return {
        message: 'Le nom de l\'entreprise est requis.',
        severity: 'error'
      };
    }
    
    if (!['monthly', 'quarterly', 'semiannual', 'annual'].includes(selectedPlan)) {
      return {
        message: 'Veuillez sélectionner un plan d\'abonnement valide.',
        severity: 'error'
      };
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationResult = validateForm();
    if (validationResult) {
      showEnhancedAlert(validationResult.message, validationResult.severity);
      return;
    }

    try {
      await dispatch(signup({ ...formData, plan: selectedPlan })).unwrap();
    } catch (error) {
      
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  useEffect(() => {
    dispatch(clearUserExists());
    return () => {
      dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
    };
  }, [dispatch]);

  useEffect(() => {
    if (snackbar.open && snackbar.severity === 'success') {
      showEnhancedAlert(
        'Votre inscription a été enregistrée avec succès. Vous recevrez un email de confirmation une fois votre compte validé par notre équipe.',
        'success',
        'Inscription en attente'
      );
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } else if (snackbar.open && snackbar.severity === 'error') {
      showEnhancedAlert(
        snackbar.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
        'error'
      );
    }
  }, [snackbar, navigate]);

  const getPlanLabel = (plan) => {
    switch (plan) {
      case 'annual':
        return 'Annuel';
      case 'semiannual':
        return 'Semestriel';
      case 'quarterly':
        return 'Trimestriel';
      case 'monthly':
        return 'Mensuel';
      default:
        return '';
    }
  };

  const getPlanBilling = (plan) => {
    switch (plan) {
      case 'annual':
        return 'Facturation annuelle';
      case 'semiannual':
        return 'Facturation semestrielle';
      case 'quarterly':
        return 'Facturation trimestrielle';
      case 'monthly':
        return 'Facturation mensuelle';
      default:
        return '';
    }
  };

  const getPlanFeature = (plan) => {
    switch (plan) {
      case 'annual':
        return 'Économie maximale';
      case 'semiannual':
        return 'Engagement moyen';
      case 'quarterly':
        return 'Option équilibrée';
      case 'monthly':
        return 'Sans engagement';
      default:
        return '';
    }
  };

  return (
    <AuthContainer>
      <BackButton onClick={handleGoBack} aria-label="Go back">
        <ArrowBackIcon />
      </BackButton>

      <FormSide>
        <LogoContainer>
          <img src={logo} alt="Logo" height="40" />
        </LogoContainer>

        <FormContainer>
          <FormTitle variant="h4">S'inscrire Pro</FormTitle>
          <FormSubtitle variant="body1">
            Créez votre compte AxiaAgile Pro pour accéder aux fonctionnalités avancées
          </FormSubtitle>

          <form onSubmit={handleSubmit}>
            <PlanSelector>
              {['monthly', 'quarterly', 'semiannual', 'annual'].map((plan) => (
                <PlanOption
                  key={plan}
                  selected={selectedPlan === plan}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="#1A237E">
                    {getPlanLabel(plan)}
                  </Typography>
                  <Typography variant="body2" color="#5c7999" sx={{ my: 0.5 }}>
                    {getPlanBilling(plan)}
                  </Typography>
                  <Typography variant="caption" color="#4CAF50" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                    {getPlanFeature(plan)}
                  </Typography>
                </PlanOption>
              ))}
            </PlanSelector>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InputLabel>Adresse email *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="email"
                  type="email"
                  variant="outlined"
                  placeholder="exemple@domaine.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel>Mot de passe *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="password"
                  type="password"
                  variant="outlined"
                  placeholder="Minimum 12 caractères"
                  value={formData.password}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <InputLabel>Prénom *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="firstName"
                  variant="outlined"
                  placeholder="Votre prénom"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <InputLabel>Nom *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="lastName"
                  variant="outlined"
                  placeholder="Votre nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel>Numéro de téléphone *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="phoneNumber"
                  variant="outlined"
                  placeholder="votre numéro de téléphone"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel>Entreprise *</InputLabel>
                <StyledTextField
                  fullWidth
                  name="entreprise"
                  variant="outlined"
                  placeholder="Nom de votre entreprise"
                  value={formData.entreprise}
                  onChange={handleInputChange}
                  size="small"
                  disabled={usersLoading}
                  required
                />
              </Grid>
            </Grid>

            <Fade in={localAlert.open}>
              <Box>
                {localAlert.open && (
                  <EnhancedAlert 
                    severity={localAlert.severity}
                    icon={getAlertIcon(localAlert.severity)}
                    onClose={() => setLocalAlert({ ...localAlert, open: false })}
                  >
                    <AlertContent>
                      <AlertTitle>{localAlert.title}</AlertTitle>
                      <AlertMessage>{localAlert.message}</AlertMessage>
                    </AlertContent>
                  </EnhancedAlert>
                )}
              </Box>
            </Fade>

            <StyledButton 
              type="submit" 
              fullWidth 
              variant="contained" 
              color="primary" 
              disabled={usersLoading}
            >
              {usersLoading ? 'Inscription en cours...' : 'S\'inscrire'}
            </StyledButton>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="#5c7999">
                Vous avez déjà un compte ? {' '}
                <Button 
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 600, 
                    color: '#1A237E',
                    p: 0,
                    minWidth: 'auto'
                  }} 
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                </Button>
              </Typography>
            </Box>
          </form>
        </FormContainer>
      </FormSide>

      <HeroSide>
        <HeroTitle variant="h5">AxiaAgile </HeroTitle>
        <HeroImageContainer>
          <HeroImg src={heroImage} alt="Hero" />
        </HeroImageContainer>
        <HeroFooter>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Solution premium pour les professionnels
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inscrivez-vous à AxiaAgile pour accéder à toutes les fonctionnalités avancées et optimiser la gestion de vos projets agiles.
          </Typography>
        </HeroFooter>
      </HeroSide>
    </AuthContainer>
  );
};

export default Subscribe;