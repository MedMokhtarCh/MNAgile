import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Button, TextField, Alert, Typography, Box, IconButton, Checkbox, FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/system';
import logo from '../assets/logo.png';
import heroImage from '../assets/hero.png';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';

const AuthContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
});

const BackButton = styled(IconButton)({
  position: 'absolute',
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
  justifyContent: 'center',
  padding: '40px',
  backgroundColor: '#fff',
});

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: 60,
});

const FormContainer = styled(Box)({
  width: '480px',
  maxWidth: '90%',
});

const StyledButton = styled(Button)({
  padding: '14px 0',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
});

const StyledTextField = styled(TextField)({
  marginBottom: 24,
  '& .MuiOutlinedInput-root': { borderRadius: 8, '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#5B9BD5' } } },
  '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
  '& .MuiInputLabel-root': { color: '#2c4b6f' },
  '& .MuiInputBase-input': { padding: '16px' },
});

const HeroSide = styled(Box)({
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: '#EBF5FB',
  color: '#1A237E',
  padding: '40px',
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
  padding: '20px 0',
});

const HeroImg = styled('img')({
  maxWidth: '85%',
  maxHeight: '60vh',
  objectFit: 'contain',
  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15))',
});

const HeroFooter = styled(Box)({
  textAlign: 'center',
  padding: '20px 0',
});

const FormTitle = styled(Typography)({
  fontWeight: 700,
  color: '#1A237E',
  marginBottom: '10px',
  fontSize: '2rem',
});

const FormSubtitle = styled(Typography)({
  color: '#5c7999',
  fontWeight: 500,
  marginBottom: '32px',
  fontSize: '1rem',
});

const InputLabel = styled(Typography)({
  fontWeight: 600,
  color: '#2c4b6f',
  marginBottom: '8px',
  fontSize: '1rem',
});

const StyledCheckbox = styled(Checkbox)({
  color: '#5B9BD5',
  '&.Mui-checked': { color: '#1A237E' },
});

const ForgotPasswordButton = styled(Button)({
  color: '#1A237E',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { backgroundColor: 'rgba(27, 94, 182, 0.1)' },
});

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleGoBack = () => {
    navigate('/');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    alert('Fonctionnalité "Mot de passe oublié" non implémentée.');
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
      alert(validationError);
      return;
    }

    await login({ email: formData.email, password: formData.password });

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };

  return (
    <AuthContainer>
      <BackButton onClick={handleGoBack} aria-label="Go back">
        <ArrowBackIcon />
      </BackButton>

      <FormSide>
        <LogoContainer>
          <img src={logo} alt="Logo" height="50" />
        </LogoContainer>

        <FormContainer>
          <FormTitle variant="h4">Bienvenue</FormTitle>
          <FormSubtitle variant="body1">Connectez-vous pour accéder à votre espace</FormSubtitle>

          <form onSubmit={handleSubmit}>
            <InputLabel>Adresse email</InputLabel>
            <StyledTextField
              fullWidth
              name="email"
              type="email"
              variant="outlined"
              placeholder="exemple@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
            />

            <InputLabel>Mot de passe</InputLabel>
            <StyledTextField
              fullWidth
              name="password"
              type="password"
              variant="outlined"
              placeholder="Entrez votre mot de passe"
              value={formData.password}
              onChange={handleInputChange}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={<StyledCheckbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
                label="Se souvenir de moi"
              />
              <ForgotPasswordButton onClick={handleForgotPassword}>Mot de passe oublié</ForgotPasswordButton>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <StyledButton type="submit" fullWidth variant="contained" color="primary" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </StyledButton>
          </form>
        </FormContainer>
      </FormSide>

      <HeroSide>
        <HeroTitle variant="h4">AxiaAgile</HeroTitle>
        <HeroImageContainer>
          <HeroImg src={heroImage} alt="Hero" />
        </HeroImageContainer>
        <HeroFooter>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Solution complète de gestion de projets agiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connectez-vous et rejoignez AxiaAgile pour optimiser la gestion de vos projets et booster la productivité de vos équipes.
          </Typography>
        </HeroFooter>
      </HeroSide>
    </AuthContainer>
  );
};

export default Login;