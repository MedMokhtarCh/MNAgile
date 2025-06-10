// AuthLayout.jsx
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/system';
import logo from '../assets/logo.png';
import heroImage from '../assets/hero.png';
import { useNavigate } from 'react-router-dom';

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

export const AuthLayout = ({ 
  children, 
  heroTitle = "AxiaAgile", 
  heroSubtitle = "Solution complète de gestion de projets agiles",
  heroDescription = "Connectez-vous et rejoignez AxiaAgile pour optimiser la gestion de vos projets et booster la productivité de vos équipes.",
  logoHeight = 40
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <AuthContainer>
      <BackButton onClick={handleGoBack} aria-label="Go back">
        <ArrowBackIcon />
      </BackButton>

      <FormSide>
        <LogoContainer>
          <img src={logo} alt="Logo" height={logoHeight} />
        </LogoContainer>
        {children}
      </FormSide>

      <HeroSide>
        <HeroTitle variant="h5">{heroTitle}</HeroTitle>
        <HeroImageContainer>
          <HeroImg src={heroImage} alt="Hero" />
        </HeroImageContainer>
        <HeroFooter>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {heroSubtitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {heroDescription}
          </Typography>
        </HeroFooter>
      </HeroSide>
    </AuthContainer>
  );
};