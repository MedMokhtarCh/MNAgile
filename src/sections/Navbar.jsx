import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Définir les pages et les boutons
const pages = [
  { label: 'À propos', id: 'about' }, 
  { label: 'Services', id: 'services' }, 
  { label: 'Fonctionnalités', id: 'features' }
];
const buttons = ['Se connecter', 'Créer un compte'];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  // Fonction pour la navigation vers une section avec un ID spécifique
  const handleScrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const handleNavigate = () => {
    navigate('/dashboard');
  };
  return (
    <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 1 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: 60, marginRight: 20 }} />
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page.label}
                  sx={{ color: 'black', marginRight: 3 }}
                  onClick={() => handleScrollToSection(page.id)} // Utiliser l'ID spécifique pour la section
                >
                  {page.label}
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ display: { xs: 'flex', md: 'none' } }} onClick={handleOpenNavMenu}>
              <MenuIcon sx={{ color: 'black' }} />
            </IconButton>
            <Menu anchorEl={anchorElNav} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}>
              {pages.map((page) => (
                <MenuItem key={page.label} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center" onClick={() => handleScrollToSection(page.id)}>
                    {page.label}
                  </Typography>
                </MenuItem>
              ))}
              {buttons.map((btn) => (
                <MenuItem key={btn} onClick={handleCloseNavMenu}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: btn === 'Créer un compte' ? '#1976d2' : 'white',
                      color: btn === 'Se connecter' ? '#1976d2' : 'white',
                      border: btn === 'Se connecter' ? '1px solid #1976d2' : 'none',
                      width: '100%',
                      textAlign: 'center',
                      '&:hover': {
                        backgroundColor: btn === 'Créer un compte' ? '#1565c0' : '#f5f5f5',
                      },
                    }}
                    onClick={handleNavigate}
                    
                  >
                    {btn}
                  </Button>
                </MenuItem>
              ))}
            </Menu>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {buttons.map((btn) => (
                <Button
                  key={btn}
                  variant="contained"
                  sx={{
                    backgroundColor: btn === 'Créer un compte' ? '#1976d2' : 'white',
                    color: btn === 'Se connecter' ? '#1976d2' : 'white',
                    border: btn === 'Se connecter' ? '1px solid #1976d2' : 'none',
                    '&:hover': {
                      backgroundColor: btn === 'Créer un compte' ? '#1565c0' : '#f5f5f5',
                    },
                  }}
                  onClick={handleNavigate}
                  
                >
                  {btn}
                </Button>
              ))}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
