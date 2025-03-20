import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardActions } from '@mui/material';
import { Button, TextField, Alert, Typography, Grid, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const StyledCard = styled(Card)({
  width: 600,
  height: 450,
  padding: 24,
  borderRadius: 12,
  boxShadow: 5,
  transition: 'transform 0.3s ease-in-out',
  position: 'relative',
  textAlign: 'center',
});

const LogoContainer = styled(Box)({
  width: 100,
  height: 100,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  marginBottom: 16,
  margin: '0 auto',
});

const AuthForms = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs requis.');
      return;
    }

    // Vérification pour Super Admin
    if (formData.email === 'superadmin@gmail.com' && formData.password === 'superadmin123') {
      setSuccess('Bienvenue sur AxiaAgile, Super Admin !');
      localStorage.setItem('token', 'fake-superadmin-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify({ email: formData.email, role: 'superadmin' }));
      navigate('/SuperAdminStatistics');
      return;
    }

    // Vérification pour les Admins
    const storedAdmins = JSON.parse(localStorage.getItem('admins')) || [];
    const foundAdmin = storedAdmins.find(
      (admin) => admin.email === formData.email && admin.password === formData.password
    );

    if (foundAdmin) {
      if (!foundAdmin.isActive) {
        setError('Ce compte admin est désactivé.');
        return;
      }

      setSuccess('Bienvenue sur AxiaAgile, Administrateur !');
      localStorage.setItem('token', 'fake-admin-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify({ email: formData.email, role: 'admin' }));
      navigate('/UserStatisticsDashboard');
      return;
    }

    // Vérification pour les Utilisateurs et Chefs de Projet
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = storedUsers.find(
      (user) => user.email === formData.email && user.password === formData.password
    );

    if (foundUser) {
      if (!foundUser.isActive) {
        setError('Ce compte est désactivé.');
        return;
      }

      const userRole = foundUser.role;
      setSuccess(`Bienvenue sur AxiaAgile, ${userRole === 'chef_projet' ? 'Chef de Projet' : 'Utilisateur'} !`);
      localStorage.setItem('token', `fake-${userRole}-jwt-token`);
      localStorage.setItem('currentUser', JSON.stringify({ 
        email: formData.email, 
        role: userRole,
        id: foundUser.id,
        nom: foundUser.nom,
        prenom: foundUser.prenom,
        permissions: foundUser.permissions || []
      }));

      if (userRole === 'chef_projet') {
        navigate('/dashboard');
      } else {
        navigate('/projects');
      }
    } else {
      setError('Email ou mot de passe incorrect.');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#f4f6f8">
      <StyledCard>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>

        <LogoContainer>
          <img src={logo} alt="AxiaAgile Logo" style={{ width: 80, height: 80 }} />
        </LogoContainer>
        
        <Typography variant="h4" gutterBottom>
          Bienvenue sur AxiaAgile !
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Connectez-vous pour accéder à votre espace de travail.
        </Typography>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  type="email"
                  label="Adresse Email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  type="password"
                  label="Mot de passe"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

            <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Se Connecter
              </Button>
            </CardActions>
          </form>
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default AuthForms;