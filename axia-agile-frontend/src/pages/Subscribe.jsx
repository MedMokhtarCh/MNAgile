import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { signup } from '../store/slices/signupSlice';
import { setSnackbar, clearUserExists } from '../store/slices/usersSlice';
import { AuthLayout } from '../layouts/AuthLayout';
import AuthForm from '../components/login/AuthForm';
import { PlanSelector } from '../components/login/theme';
import PlanLabel from '../components/login/PlanLabel';

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
  const { signupLoading } = useSelector((state) => state.signup);
  const { snackbar } = useSelector((state) => state.users);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localAlert.open) {
      setLocalAlert({ ...localAlert, open: false });
    }
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
      return { message: 'Tous les champs sont obligatoires.', severity: 'error' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { message: 'Email invalide.', severity: 'error' };
    }
    
    if (formData.password.length < 12 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) {
      return { message: 'Mot de passe faible.', severity: 'error' };
    }
    
    const phoneRegex = /^\+?[\d\s-]{8,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      return { message: 'Numéro de téléphone invalide.', severity: 'error' };
    }
    
    if (formData.entreprise.trim().length === 0) {
      return { message: 'Nom d\'entreprise requis.', severity: 'error' };
    }
    
    if (!['monthly', 'quarterly', 'semiannual', 'annual'].includes(selectedPlan)) {
      return { message: 'Plan invalide.', severity: 'error' };
    }
    
    return null;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      entreprise: '',
    });
    setSelectedPlan('annual');
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
      resetForm();
    } catch (error) {
      // Error handled by snackbar in useEffect
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckCircleIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  useEffect(() => {
    dispatch(clearUserExists());
    return () => {
      dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
    };
  }, [dispatch]);

  useEffect(() => {
    if (snackbar.open) {
      showEnhancedAlert(
        snackbar.message || (snackbar.severity === 'success'
          ? 'Inscription réussie. Email de confirmation en attente.'
          : 'Erreur lors de l\'inscription.'),
        snackbar.severity,
        snackbar.severity === 'success' ? 'Inscription en attente' : undefined
      );
      if (snackbar.severity === 'success') {
        setTimeout(() => navigate('/login'), 4000);
      }
    }
  }, [snackbar, navigate]);

  const fields = [
    { name: 'email', type: 'email', label: 'Adresse email', placeholder: 'exemple@domaine.com', value: formData.email, required: true },
    { name: 'password', type: 'password', label: 'Mot de passe', placeholder: 'Minimum 12 caractères', value: formData.password, required: true },
    { name: 'firstName', type: 'text', label: 'Prénom', placeholder: 'Votre prénom', value: formData.firstName, required: true, gridSize: 6 },
    { name: 'lastName', type: 'text', label: 'Nom', placeholder: 'Votre nom', value: formData.lastName, required: true, gridSize: 6 },
    { name: 'phoneNumber', type: 'text', label: 'Numéro de téléphone', placeholder: 'Votre téléphone', value: formData.phoneNumber, required: true },
    { name: 'entreprise', type: 'text', label: 'Entreprise', placeholder: 'Nom de votre entreprise', value: formData.entreprise, required: true },
  ].map(field => ({ ...field, onChange: handleInputChange }));

  return (
    <AuthLayout
      heroTitle="AxiaAgile Pro"
      heroSubtitle="Solution premium pour les professionnels"
      heroDescription="Inscrivez-vous à AxiaAgile pour optimiser vos projets agiles."
    >
      <AuthForm
        formTitle="S'inscrire Pro"
        formSubtitle="Créez votre compte AxiaAgile Pro"
        fields={fields}
        onSubmit={handleSubmit}
        submitButtonText="S'inscrire"
        isLoading={signupLoading}
        alert={localAlert}
        setAlert={setLocalAlert}
        getAlertIcon={getAlertIcon}
        additionalElements={() => (
          <PlanSelector>
            {['monthly', 'quarterly', 'semiannual', 'annual'].map((plan) => (
              <PlanLabel
                key={plan}
                plan={plan}
                selected={selectedPlan === plan}
                onClick={() => setSelectedPlan(plan)}
              />
            ))}
          </PlanSelector>
        )}
        footer={() => (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="#5c7999">
              Déjà un compte ? {' '}
              <Button 
                sx={{ textTransform: 'none', fontWeight: 600, color: '#1A237E', p: 0, minWidth: 'auto' }} 
                onClick={() => navigate('/login')}
              >
                Se connecter
              </Button>
            </Typography>
          </Box>
        )}
      />
    </AuthLayout>
  );
};

export default Subscribe;