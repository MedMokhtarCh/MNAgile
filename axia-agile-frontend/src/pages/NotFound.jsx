import React, { useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Animation pour les éléments numériques
  useEffect(() => {
    const interval = setInterval(() => {
      const glitch = document.querySelector('.glitch-effect');
      if (glitch) {
        glitch.classList.add('active');
        setTimeout(() => {
          glitch.classList.remove('active');
        }, 200);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Formes décoratives en arrière-plan */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.03,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            initial={{ opacity: 0.7 }}
            animate={{ 
              x: [Math.random() * 100, Math.random() * -100],
              y: [Math.random() * 100, Math.random() * -100],
              rotate: [0, 360],
            }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, repeatType: "reverse" }}
            sx={{
              position: 'absolute',
              width: 100 + i * 50,
              height: 100 + i * 50,
              borderRadius: '50%',
              background: `rgba(33, 150, 243, ${0.05 + i * 0.01})`,
              filter: 'blur(8px)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid 
          container 
          spacing={4} 
          alignItems="center" 
          justifyContent="center"
          sx={{ minHeight: '80vh' }}
        >
          {/* Section principale */}
          <Grid item xs={12} md={6} sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Box sx={{ mb: 6 }}>
              <Typography 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 500,
                  color: '#2196F3',
                  mb: 1,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Erreur 404
              </Typography>
              
              <Typography 
                variant="h1" 
                component={motion.h1}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                sx={{ 
                  fontWeight: 900,
                  fontSize: isMobile ? '2.5rem' : '4rem',
                  lineHeight: 1.1,
                  mb: 3,
                  backgroundImage: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Oups ! Page introuvable
              </Typography>
              
              <Typography 
                variant="body1" 
                component={motion.p}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                color="text.secondary"
                sx={{ 
                  fontSize: '1.1rem',
                  maxWidth: '550px',
                  mb: 4,
                  lineHeight: 1.6,
                  mx: isMobile ? 'auto' : 0,
                }}
              >
                La page que vous recherchez semble avoir disparu dans l'espace numérique.
                Peut-être a-t-elle été déplacée ou n'existe plus.
              </Typography>
              
              <Box 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'center' : 'flex-start',
                }}
              >
                <Button 
                  variant="contained" 
                  onClick={handleGoHome}
                  startIcon={<HomeIcon />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: '50px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.39)',
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
                    }
                  }}
                >
                  Retour à l'accueil
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={handleGoBack}
                  startIcon={<KeyboardBackspaceIcon />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: '50px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderColor: '#2196F3',
                    color: '#2196F3',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      borderColor: '#2196F3',
                    }
                  }}
                >
                  Page précédente
                </Button>
              </Box>
            </Box>
          </Grid>
          
          {/* Section illustration */}
          <Grid 
            item 
            xs={12} 
            md={6} 
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box sx={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              {/* Numéro 404 stylisé */}
              <Typography 
                className="glitch-effect"
                sx={{
                  fontWeight: 900,
                  fontSize: isMobile ? '8rem' : '12rem',
                  textAlign: 'center',
                  position: 'relative',
                  color: 'transparent',
                  textShadow: '3px 3px 0 #2196F3, -3px -3px 0 #21CBF3',
                  WebkitTextStroke: '2px #2196F3',
                  '@keyframes glitch': {
                    '0%': {
                      textShadow: '3px 3px 0 #2196F3, -3px -3px 0 #21CBF3',
                      transform: 'translate(0)',
                    },
                    '20%': {
                      textShadow: '-3px 3px 0 #2196F3, 3px -3px 0 #21CBF3',
                      transform: 'translate(2px, 2px)',
                    },
                    '40%': {
                      textShadow: '3px -3px 0 #2196F3, -3px 3px 0 #21CBF3',
                      transform: 'translate(-2px, -2px)',
                    },
                    '60%': {
                      textShadow: '-3px -3px 0 #2196F3, 3px 3px 0 #21CBF3',
                      transform: 'translate(2px, -2px)',
                    },
                    '80%': {
                      textShadow: '3px 3px 0 #2196F3, -3px -3px 0 #21CBF3',
                      transform: 'translate(-2px, 2px)',
                    },
                    '100%': {
                      textShadow: '3px 3px 0 #2196F3, -3px -3px 0 #21CBF3',
                      transform: 'translate(0)',
                    },
                  },
                  '&.active': {
                    animation: 'glitch 0.3s linear',
                  }
                }}
              >
                404
              </Typography>
              
              {/* Cercles décoratifs autour du 404 */}
              {[...Array(3)].map((_, i) => (
                <Box
                  key={i}
                  component={motion.div}
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ 
                    scale: [0.8, 1, 0.8],
                    opacity: [0.7, 0.5, 0.7],
                  }}
                  transition={{ 
                    duration: 3 + i, 
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                  sx={{
                    position: 'absolute',
                    borderRadius: '50%',
                    border: '2px solid rgba(33, 150, 243, 0.2)',
                    width: `${i * 25 + 90}%`,
                    height: `${i * 25 + 90}%`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -1,
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default NotFound;