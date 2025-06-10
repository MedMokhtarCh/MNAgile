import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, FormControlLabel, Alert, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { AuthLayout } from '../layouts/AuthLayout';
import AuthForm from '../components/login/AuthForm';
import { StyledCheckbox, ForgotPasswordButton, SignUpButton } from '../components/login/theme';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [localAlert, setLocalAlert] = useState({ open: false, message: '', severity: 'info', title: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotPassword = () => {
    alert('Fonctionnalité "Mot de passe oublié" non implémentée.');
  };

  const handleSignUp = () => {
    navigate('/subscribe');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      return 'Veuillez remplir tous les champs requis.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Veuillez entrer un email valide.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setLocalAlert({
        open: true,
        message: validationError,
        severity: 'error',
        title: 'Erreur de validation'
      });
      setTimeout(() => setLocalAlert({ ...localAlert, open: false }), 4000);
      return;
    }

    await login({ email: formData.email, password: formData.password });

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };

  const getAlertIcon = () => null; 

  useEffect(() => {
    if (error) {
      setLocalAlert({
        open: true,
        message: error,
        severity: 'error',
        title: 'Erreur de connexion'
      });
      setTimeout(() => setLocalAlert({ ...localAlert, open: false }), 4000);
    }
    if (success) {
      setLocalAlert({
        open: true,
        message: success,
        severity: 'success',
        title: 'Connexion réussie'
      });
      setTimeout(() => setLocalAlert({ ...localAlert, open: false }), 4000);
    }
  }, [error, success]);

  const fields = [
    { name: 'email', type: 'email', label: 'Adresse email', placeholder: 'exemple@gmail.com', value: formData.email, onChange: handleInputChange, required: true },
    { name: 'password', type: 'password', label: 'Mot de passe', placeholder: 'Entrez votre mot de passe', value: formData.password, onChange: handleInputChange, required: true },
  ];

  return (
    <AuthLayout 
      logoHeight={50}
      heroTitle="AxiaAgile"
      heroSubtitle="Solution complète de gestion de projets agiles"
      heroDescription="Connectez-vous et rejoignez AxiaAgile pour optimiser la gestion de vos projets et booster la productivité de vos équipes."
    >
      <Box sx={{ width: '480px', maxWidth: '90%', paddingBottom: '40px' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <AuthForm
          formTitle="Bienvenue"
          formSubtitle="Connectez-vous pour accéder à votre espace"
          fields={fields}
          onSubmit={handleSubmit}
          submitButtonText="Se connecter"
          isLoading={loading}
          alert={localAlert}
          setAlert={setLocalAlert}
          getAlertIcon={getAlertIcon}
          additionalElements={null} 
          footer={() => (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={<StyledCheckbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
                  label="Se souvenir de moi"
                />
                <ForgotPasswordButton onClick={handleForgotPassword}>Mot de passe oublié</ForgotPasswordButton>
              </Box>
              <Box sx={{ mt: 2, textAlign: 'center', pb: 4 }}>
                <Typography variant="body2" color="#5c7999">
                  Vous n'avez pas de compte ? {' '}
                  <SignUpButton onClick={handleSignUp}>
                    Créer un compte
                  </SignUpButton>
                </Typography>
              </Box>
            </>
          )}
        />
      </Box>
    </AuthLayout>
  );
};

export default Login;