import React from 'react';
// Import des composants Material UI
import { 
  Box, 
  Typography, 
  LinearProgress,
  Container 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Création d'un thème personnalisé
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Bleu primaire Material UI
    },
    secondary: {
      main: '#90caf9', // Bleu secondaire plus clair
    },
    background: {
      default: '#ffffff', // Fond blanc
    },
  },
});

const LoadingPage = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          width: '100%',
        }}
      >
        <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" color="primary" gutterBottom>
              Chargement
            </Typography>
            
            {/* Barre de progression linéaire */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress color="primary" />
            </Box>
            
            {/* Points de chargement avec animation */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              {[0, 1, 2, 3].map((index) => (
                <Box
                  key={index}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    opacity: 1 - (index * 0.2),
                    animation: 'bounce 1.4s infinite ease-in-out',
                    animationDelay: `${index * 0.1}s`,
                    '@keyframes bounce': {
                      '0%, 100%': {
                        transform: 'translateY(0)',
                      },
                      '50%': {
                        transform: 'translateY(-10px)',
                      },
                    },
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="body2" color="primary">
              Veuillez patienter...
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default LoadingPage;