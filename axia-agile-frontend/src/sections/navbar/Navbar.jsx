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
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom'; 
import { styled } from '@mui/material/styles';
// Import l'icône pour l'abonnement
import PaidIcon from '@mui/icons-material/Paid';
// ou alternativement SubscriptionsIcon
// import SubscriptionsIcon from '@mui/icons-material/Subscriptions';


const LoginButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: '6px 20px',
  fontWeight: 600,
  textTransform: 'none',
  backgroundColor: 'white',
  color: '#5065f2',
  fontSize: '14px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
  '&:hover': {
    backgroundColor: '#f8f9fa',
  },
}));

// Styliser le bouton "Créer un compte"
const SignupButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: '6px 20px',
  fontWeight: 600,
  textTransform: 'none',
  backgroundColor: '#5065f2',
  color: 'white',
  fontSize: '14px',
  marginLeft: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
  '&:hover': {
    backgroundColor: '#3f51b5',
  },
}));

const pages = [
  { label: 'À propos', id: 'about' }, 
  { label: 'Services', id: 'services' }, 
  { label: 'Fonctionnalités', id: 'features' }
];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  
  const handleScrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleNavigate = () => {
    navigate('/Login');
  };

  const handleSignup = () => {
    navigate('/Subscribe');
  };
  
  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: 'white', 
        boxShadow: 'none', 
        borderBottom: 'none', 
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: 40 }} />
          </Box>

          {/* Desktop Navigation Links - Centered */}
          <Box sx={{ 
            flexGrow: 0, 
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
            ml: 'auto',
            mr: 'auto'
          }}>
            {pages.map((page) => (
              <Button
                key={page.label}
                sx={{ 
                  color: '#4a4a4a', 
                  mx: 2,
                  textTransform: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#5065f2',
                  },
                }}
                onClick={() => handleScrollToSection(page.id)}
              >
                {page.label}
              </Button>
            ))}
          </Box>

         
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
          
            <IconButton 
              sx={{ 
                display: { xs: 'flex', md: 'none' }, 
                ml: 'auto' 
              }} 
              onClick={handleOpenNavMenu}
            >
              <MenuIcon sx={{ color: '#555' }} />
            </IconButton>

            {/* Mobile Menu */}
            <Menu 
              anchorEl={anchorElNav} 
              open={Boolean(anchorElNav)} 
              onClose={handleCloseNavMenu}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '10px',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.08)',
                  mt: 1.5,
                },
              }}
            >
              {pages.map((page) => (
                <MenuItem 
                  key={page.label} 
                  onClick={() => {
                    handleCloseNavMenu();
                    handleScrollToSection(page.id);
                  }}
                >
                  <Typography sx={{ color: '#555', fontWeight: 500 }}>
                    {page.label}
                  </Typography>
                </MenuItem>
              ))}

              {/* Login Button in Mobile Menu */}
              <MenuItem onClick={handleCloseNavMenu}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: '#5065f2',
                    borderColor: '#5065f2',
                    borderRadius: '20px',
                    padding: '6px 16px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                  onClick={handleNavigate}
                >
                  Se connecter
                </Button>
              </MenuItem>

              {/* Signup Button in Mobile Menu */}
              <MenuItem onClick={handleCloseNavMenu}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#5065f2',
                    color: 'white',
                    borderRadius: '20px',
                    padding: '6px 16px', 
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#3f51b5',
                    },
                  }}
                  onClick={handleSignup}
                  startIcon={<PaidIcon fontSize="small" />}
                >
                  Créer un compte
                </Button>
              </MenuItem>
            </Menu>

            {/* Desktop Login and Signup Buttons */}
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <LoginButton onClick={handleNavigate}>
                Se connecter
              </LoginButton>
              <SignupButton onClick={handleSignup} startIcon={<PaidIcon fontSize="small" />}>
                Créer un compte
              </SignupButton>
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;