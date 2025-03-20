import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Toolbar,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tooltip,
  CircularProgress,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  ListItemText
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Map as MapIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  SecurityOutlined as SecurityIcon,
  AdminPanelSettingsOutlined as AdminIcon
} from '@mui/icons-material';


const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', 
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1d4ed8',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f1f5f9',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#334155',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});


const availablePermissions = [
  { id: 'create_users', label: 'Créer des utilisateurs', description: 'Peut créer des utilisateurs réguliers' },
  { id: 'create_project_managers', label: 'Créer des chefs de projet', description: 'Peut créer des comptes chef de projet' },

];

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ 
    email: '', 
    password: '', 
    entreprise: '', 
    adresse: '', 
    telephone: '',
    role: 'admin',
    permissions: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const storedAdmins = JSON.parse(localStorage.getItem('admins')) || [];
      
      const updatedAdmins = storedAdmins.map(admin => ({
        ...admin,
        permissions: admin.permissions || []
      }));
      setAdmins(updatedAdmins);
      
    
      const uniqueEntreprises = [...new Set(updatedAdmins.map(admin => admin.entreprise))].filter(Boolean);
      setEntreprises(uniqueEntreprises);
      
      setLoading(false);
    }, 500); 
  }, []);

  const handleCreateAdmin = () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.entreprise || !newAdmin.adresse || !newAdmin.telephone) {
      showSnackbar('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    if (!validateEmail(newAdmin.email)) {
      showSnackbar('Format d\'email invalide', 'error');
      return;
    }
    
    if (newAdmin.password.length < 8) {
      showSnackbar('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    
    if (editMode) {
      
      const updatedAdmins = admins.map(admin => 
        admin.id === currentAdminId 
          ? { ...admin, 
              email: newAdmin.email,
              entreprise: newAdmin.entreprise,
              adresse: newAdmin.adresse,
              telephone: newAdmin.telephone,
              permissions: newAdmin.permissions
            } 
          : admin
      );
      
      setAdmins(updatedAdmins);
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));
      showSnackbar('Compte admin modifié avec succès!', 'success');
    } else {
     
      const existingAdmin = admins.find(admin => admin.email === newAdmin.email);
      if (existingAdmin) {
        showSnackbar('Cet email est déjà utilisé', 'error');
        return;
      }
      
      const updatedAdmins = [...admins, { 
        ...newAdmin, 
        id: Date.now(), 
        isActive: true,
        dateCreated: new Date().toISOString(),
        lastLogin: null
      }];
      
      setAdmins(updatedAdmins);
      
      
      if (!entreprises.includes(newAdmin.entreprise) && newAdmin.entreprise) {
        setEntreprises([...entreprises, newAdmin.entreprise]);
      }
      
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));
      showSnackbar('Compte admin créé avec succès!', 'success');
    }
    
    setNewAdmin({ email: '', password: '', entreprise: '', adresse: '', telephone: '', role: 'admin', permissions: [] });
    setOpenModal(false);
    setEditMode(false);
    setCurrentAdminId(null);
  };

  const handleEditAdmin = (id) => {
    const adminToEdit = admins.find(admin => admin.id === id);
    if (adminToEdit) {
      setNewAdmin({
        email: adminToEdit.email,
        password: '', 
        entreprise: adminToEdit.entreprise,
        adresse: adminToEdit.adresse,
        telephone: adminToEdit.telephone,
        role: adminToEdit.role,
        permissions: adminToEdit.permissions || []
      });
      setEditMode(true);
      setCurrentAdminId(id);
      setOpenModal(true);
    }
  };

  const handleOpenPermissionsModal = (admin) => {
    setSelectedAdminForPermissions(admin);
    setOpenPermissionsModal(true);
  };

  const handleSavePermissions = () => {
    if (!selectedAdminForPermissions) return;
    
    const updatedAdmins = admins.map(admin => 
      admin.id === selectedAdminForPermissions.id 
        ? { ...admin, permissions: selectedAdminForPermissions.permissions } 
        : admin
    );
    
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    showSnackbar('Autorisations mises à jour avec succès!', 'success');
    setOpenPermissionsModal(false);
    setSelectedAdminForPermissions(null);
  };

  const handlePermissionChange = (permissionId) => {
    if (!selectedAdminForPermissions) return;
    
    const currentPermissions = [...selectedAdminForPermissions.permissions];
    const permissionIndex = currentPermissions.indexOf(permissionId);
    
    if (permissionIndex === -1) {
      currentPermissions.push(permissionId);
    } else {
      currentPermissions.splice(permissionIndex, 1);
    }
    
    setSelectedAdminForPermissions({
      ...selectedAdminForPermissions,
      permissions: currentPermissions
    });
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleToggleActive = (id) => {
    const updatedAdmins = admins.map(admin => 
      admin.id === id ? { ...admin, isActive: !admin.isActive } : admin
    );
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    
    const admin = updatedAdmins.find(a => a.id === id);
    showSnackbar(`Compte ${admin.isActive ? 'activé' : 'désactivé'} pour ${admin.email}`, 'info');
  };

  const handleDeleteAdmin = (id) => {
    const admin = admins.find(a => a.id === id);
    const updatedAdmins = admins.filter(admin => admin.id !== id);
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    showSnackbar(`Compte supprimé pour ${admin.email}`, 'success');
    
  
    const remainingEntreprises = [...new Set(updatedAdmins.map(a => a.entreprise))].filter(Boolean);
    setEntreprises(remainingEntreprises);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handlePermissionSelectionChange = (event) => {
    const {
      target: { value },
    } = event;
    
    setNewAdmin({
      ...newAdmin,
      permissions: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         admin.entreprise.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && admin.isActive) || 
                         (filterStatus === 'inactive' && !admin.isActive);
    const matchesEntreprise = !selectedEntreprise || admin.entreprise === selectedEntreprise;
    
    return matchesSearch && matchesFilter && matchesEntreprise;
  });
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" color="text.primary">Gestion des Comptes Admin</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              setEditMode(false);
              setNewAdmin({ email: '', password: '', entreprise: '', adresse: '', telephone: '', role: 'admin', permissions: [] });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouvel Admin
          </Button>
        </Box>
        
       
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
              <TextField
                placeholder="Rechercher..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon /></InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: '300px' } }}
              />
              <Autocomplete
                id="entreprise-filter"
                options={entreprises}
                value={selectedEntreprise}
                onChange={(event, newValue) => {
                  setSelectedEntreprise(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrer par entreprise"
                    size="small"
                    sx={{ width: { xs: '100%', sm: '250px' } }}
                  />
                )}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatus}
                  label="Statut"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="active">Actifs</MenuItem>
                  <MenuItem value="inactive">Inactifs</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Rafraîchir">
                <IconButton onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 500);
                }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
        
        {/* Tableau des admins */}
        <Paper sx={{ overflow: 'hidden', mb: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Adresse</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Autorisations</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>Chargement des données...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1">Aucun compte administrateur trouvé</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />} 
                        onClick={() => setOpenModal(true)}
                        sx={{ mt: 2 }}
                      >
                        Ajouter un admin
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map(admin => (
                    <TableRow key={admin.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: admin.isActive ? 'primary.main' : 'grey.400' }}>
                            {admin.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{admin.email}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Admin
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{admin.entreprise}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MapIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {admin.adresse}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{admin.telephone}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SecurityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Chip 
                            label={`${admin.permissions ? admin.permissions.length : 0} autorisations`} 
                            size="small"
                            color="info"
                            onClick={() => handleOpenPermissionsModal(admin)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Switch 
                            checked={admin.isActive} 
                            onChange={() => handleToggleActive(admin.id)} 
                            color="secondary"
                          />
                          <Chip 
                            label={admin.isActive ? 'Actif' : 'Inactif'} 
                            size="small"
                            color={admin.isActive ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleEditAdmin(admin.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteAdmin(admin.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
      
      {/* Modal de création/édition d'admin */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {editMode ? 'Modifier un compte administrateur' : 'Créer un nouveau compte administrateur'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                label="Email" 
                fullWidth 
                value={newAdmin.email} 
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label={editMode ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
                type="password" 
                fullWidth 
                value={newAdmin.password} 
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                id="entreprise-input"
                options={entreprises}
                inputValue={newAdmin.entreprise}
                onInputChange={(event, newValue) => {
                  setNewAdmin({ ...newAdmin, entreprise: newValue });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params}
                    label="Entreprise" 
                    fullWidth 
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Téléphone" 
                fullWidth 
                value={newAdmin.telephone} 
                onChange={(e) => setNewAdmin({ ...newAdmin, telephone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Adresse" 
                fullWidth 
                value={newAdmin.adresse} 
                onChange={(e) => setNewAdmin({ ...newAdmin, adresse: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><MapIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip icon={<SecurityIcon />} label="Autorisations" />
              </Divider>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="multiple-permissions-label">Autorisations</InputLabel>
                <Select
                  labelId="multiple-permissions-label"
                  id="multiple-permissions"
                  multiple
                  value={newAdmin.permissions}
                  onChange={handlePermissionSelectionChange}
                  renderValue={(selected) => {
                    return selected.map(id => {
                      const permission = availablePermissions.find(p => p.id === id);
                      return permission ? permission.label : id;
                    }).join(', ');
                  }}
                >
                  {availablePermissions.map((permission) => (
                    <MenuItem key={permission.id} value={permission.id}>
                      <Checkbox checked={newAdmin.permissions.indexOf(permission.id) > -1} />
                      <ListItemText 
                        primary={permission.label} 
                        secondary={permission.description}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined">Annuler</Button>
          <Button variant="contained" onClick={handleCreateAdmin}>
            {editMode ? 'Enregistrer modifications' : 'Créer compte'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de gestion des autorisations */}
      <Dialog open={openPermissionsModal} onClose={() => setOpenPermissionsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SecurityIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Gestion des autorisations
              {selectedAdminForPermissions && (
                <Typography variant="body2" color="text.secondary">
                  {selectedAdminForPermissions.email}
                </Typography>
              )}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAdminForPermissions && (
            <FormGroup>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sélectionnez les autorisations pour cet administrateur. Les autorisations définissent les actions que cet administrateur pourra effectuer.
              </Typography>
              {availablePermissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={selectedAdminForPermissions.permissions?.includes(permission.id) || false}
                      onChange={() => handlePermissionChange(permission.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{permission.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {permission.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
              ))}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsModal(false)}>Annuler</Button>
          <Button variant="contained" color="primary" onClick={handleSavePermissions}>
            Enregistrer les autorisations
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} elevation={6} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default SuperAdminDashboard;