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
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  SupervisorAccount as ChefProjetIcon,
  ManageAccounts as PermissionsIcon,
  Assignment as TaskIcon,
  FolderOpen as ProjectIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';

// Permissions réorganisées par catégorie
const permissionsGroups = {
  projects: {
    title: "Projets",
    icon: <ProjectIcon />,
    permissions: [
      { id: 'project_view', label: 'Consulter', description: 'Peut consulter les projets' },
      { id: 'project_create', label: 'Créer', description: 'Peut créer de nouveaux projets' },
      { id: 'project_edit', label: 'Modifier', description: 'Peut modifier les projets existants' },
      { id: 'project_delete', label: 'Supprimer', description: 'Peut supprimer des projets' },
    ],
  },
  tasks: {
    title: "Tâches",
    icon: <TaskIcon />,
    permissions: [
      { id: 'task_view', label: 'Consulter', description: 'Peut consulter les tâches' },
      { id: 'task_create', label: 'Créer', description: 'Peut créer de nouvelles tâches' },
      { id: 'task_edit', label: 'Modifier', description: 'Peut modifier les tâches existantes' },
      { id: 'task_delete', label: 'Supprimer', description: 'Peut supprimer des tâches' },
      { id: 'task_assign', label: 'Assigner', description: 'Peut assigner des tâches aux utilisateurs' },
    ],
  },
  reports: {
    title: "Rapports",
    icon: <ReportIcon />,
    permissions: [
      { id: 'report_view', label: 'Consulter', description: 'Peut consulter les rapports' },
      { id: 'report_create', label: 'Créer', description: 'Peut créer de nouveaux rapports' },
      { id: 'report_export', label: 'Exporter', description: 'Peut exporter les rapports' },
    ],
  },
};

// Mêmes permissions pour tous les utilisateurs
const allPermissions = [
  ...permissionsGroups.projects.permissions,
  ...permissionsGroups.tasks.permissions,
  ...permissionsGroups.reports.permissions,
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
    role: 'user',
    jobTitle: '', // Ajout du job title
    permissions: [],
    isActive: true, // Statut actif par défaut
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);
  const [hasCreateUserPermission, setHasCreateUserPermission] = useState(false);
  const [hasCreateProjectManagerPermission, setHasCreateProjectManagerPermission] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Récupérer les utilisateurs existants
    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUsers = storedUsers.map((user) => ({
        ...user,
        permissions: user.permissions || [],
        isActive: user.isActive !== undefined ? user.isActive : true, // Par défaut, actif
        jobTitle: user.jobTitle || '', // Ajout du job title
      }));
      setUsers(updatedUsers);
      setLoading(false);
    }, 500); // Simuler un chargement

    // Vérifier les permissions de l'admin connecté
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    if (currentUser.role === 'admin') {
      const admins = JSON.parse(localStorage.getItem('admins')) || [];
      const adminData = admins.find((admin) => admin.email === currentUser.email);

      if (adminData) {
        setCurrentUserPermissions(adminData.permissions || []);
        setHasCreateUserPermission(adminData.permissions?.includes('create_users') || false);
        setHasCreateProjectManagerPermission(adminData.permissions?.includes('create_project_managers') || false);
      }
    } else if (currentUser.role === 'superadmin') {
      // Le superadmin a toutes les permissions
      setHasCreateUserPermission(true);
      setHasCreateProjectManagerPermission(true);
    }
  }, []);

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.nom || !newUser.prenom || !newUser.jobTitle) {
      showSnackbar('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    // Vérifier si l'admin a la permission de créer ce type d'utilisateur
    if (newUser.role === 'chef_projet' && !hasCreateProjectManagerPermission) {
      showSnackbar('Vous n\'avez pas la permission de créer des chefs de projet', 'error');
      return;
    } else if (newUser.role === 'user' && !hasCreateUserPermission) {
      showSnackbar('Vous n\'avez pas la permission de créer des utilisateurs', 'error');
      return;
    }

    if (!validateEmail(newUser.email)) {
      showSnackbar('Format d\'email invalide', 'error');
      return;
    }

    if (newUser.password.length < 8) {
      showSnackbar('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    if (editMode) {
      // Mode édition
      const updatedUsers = users.map((user) =>
        user.id === currentUserId
          ? {
              ...user,
              email: newUser.email,
              nom: newUser.nom,
              prenom: newUser.prenom,
              telephone: newUser.telephone,
              role: newUser.role,
              jobTitle: newUser.jobTitle, // Ajout du job title
              permissions: newUser.permissions,
              isActive: newUser.isActive, // Conserver le statut actif/inactif
            }
          : user
      );

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      showSnackbar('Compte utilisateur modifié avec succès!', 'success');
    } else {
      // Mode création
      const existingUser = users.find((user) => user.email === newUser.email);
      if (existingUser) {
        showSnackbar('Cet email est déjà utilisé', 'error');
        return;
      }

      // Récupérer l'admin actuel
      const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

      const updatedUsers = [
        ...users,
        {
          ...newUser,
          id: Date.now(),
          isActive: true, // Par défaut, l'utilisateur est actif
          dateCreated: new Date().toISOString(),
          lastLogin: null,
          createdBy: currentUser.email,
        },
      ];

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      showSnackbar(`${newUser.role === 'chef_projet' ? 'Chef de projet' : 'Utilisateur'} créé avec succès!`, 'success');
    }

    setNewUser({
      email: '',
      password: '',
      nom: '',
      prenom: '',
      telephone: '',
      role: 'user',
      jobTitle: '', // Réinitialiser le job title
      permissions: [],
      isActive: true, // Réinitialiser pour le prochain utilisateur
    });
    setOpenModal(false);
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleEditUser = (id) => {
    const userToEdit = users.find((user) => user.id === id);
    if (userToEdit) {
      setNewUser({
        email: userToEdit.email,
        password: '',
        nom: userToEdit.nom,
        prenom: userToEdit.prenom,
        telephone: userToEdit.telephone || '',
        role: userToEdit.role,
        jobTitle: userToEdit.jobTitle || '', // Ajout du job title
        permissions: userToEdit.permissions || [],
        isActive: userToEdit.isActive, // Conserver le statut actif/inactif
      });
      setEditMode(true);
      setCurrentUserId(id);
      setOpenModal(true);
    }
  };

  const handleOpenPermissionsModal = (user) => {
    setSelectedUserForPermissions(user);
    setOpenPermissionsModal(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUserForPermissions) return;

    const updatedUsers = users.map((user) =>
      user.id === selectedUserForPermissions.id
        ? { ...user, permissions: selectedUserForPermissions.permissions }
        : user
    );

    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    showSnackbar('Autorisations mises à jour avec succès!', 'success');
    setOpenPermissionsModal(false);
    setSelectedUserForPermissions(null);
  };

  const handlePermissionChange = (permissionId) => {
    if (!selectedUserForPermissions) return;

    const currentPermissions = [...selectedUserForPermissions.permissions];
    const permissionIndex = currentPermissions.indexOf(permissionId);

    if (permissionIndex === -1) {
      currentPermissions.push(permissionId);
    } else {
      currentPermissions.splice(permissionIndex, 1);
    }

    setSelectedUserForPermissions({
      ...selectedUserForPermissions,
      permissions: currentPermissions,
    });
  };

  const handlePermissionCheckboxChange = (event) => {
    const { name, checked } = event.target;

    if (checked) {
      setNewUser({
        ...newUser,
        permissions: [...newUser.permissions, name],
      });
    } else {
      setNewUser({
        ...newUser,
        permissions: newUser.permissions.filter((permission) => permission !== name),
      });
    }
  };

  const isPermissionChecked = (permissionId) => {
    return newUser.permissions.includes(permissionId);
  };

  const isPermissionCheckedInModal = (permissionId) => {
    return selectedUserForPermissions?.permissions?.includes(permissionId) || false;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleToggleActive = (id) => {
    const updatedUsers = users.map((user) =>
      user.id === id ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const user = updatedUsers.find((u) => u.id === id);
    showSnackbar(`Compte ${user.isActive ? 'activé' : 'désactivé'} pour ${user.email}`, 'info');
  };

  const handleDeleteUser = (id) => {
    const user = users.find((u) => u.id === id);
    const updatedUsers = users.filter((user) => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    showSnackbar(`Compte supprimé pour ${user.email}`, 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesFilter && matchesRole;
  });

  return (
    <ThemeProvider
      theme={createTheme({
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
        },
        typography: {
          fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        shape: {
          borderRadius: 10,
        },
      })}
    >
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          {(hasCreateUserPermission || hasCreateProjectManagerPermission) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditMode(false);
                setNewUser({
                  email: '',
                  password: '',
                  nom: '',
                  prenom: '',
                  telephone: '',
                  role: 'user',
                  jobTitle: '', // Réinitialiser le job title
                  permissions: [],
                  isActive: true, // Réinitialiser pour le prochain utilisateur
                });
                setOpenModal(true);
              }}
            >
              Nouvel Utilisateur
            </Button>
          )}
        </Box>

        {/* Barre d'outils pour la recherche et le filtrage */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Rechercher par nom, prénom ou email..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={filterRole}
                  label="Rôle"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="user">Utilisateurs</MenuItem>
                  <MenuItem value="chef_projet">Chefs de projet</MenuItem>
                </Select>
              </FormControl>
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
                <IconButton
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 500);
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Message d'alerte si l'admin n'a pas les permissions nécessaires */}
        {!hasCreateUserPermission && !hasCreateProjectManagerPermission && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Vous n'avez pas les permissions nécessaires pour créer des utilisateurs ou des chefs de projet. Veuillez
            contacter le super administrateur pour obtenir ces permissions.
          </Alert>
        )}

        {/* Tableau des utilisateurs */}
        <Paper sx={{ overflow: 'hidden', mb: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Contact</TableCell>
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
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Chargement des données...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1">Aucun utilisateur trouvé</Typography>
                      {(hasCreateUserPermission || hasCreateProjectManagerPermission) && (
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => setOpenModal(true)}
                          sx={{ mt: 2 }}
                        >
                          Ajouter un utilisateur
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              width: 32,
                              height: 32,
                              bgcolor: user.role === 'chef_projet' ? 'secondary.main' : 'primary.main',
                            }}
                          >
                            {user.prenom?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{`${user.prenom || ''} ${user.nom || ''}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.role === 'chef_projet' ? <ChefProjetIcon /> : <PersonIcon />}
                          label={user.role === 'chef_projet' ? 'Chef de Projet' : 'Utilisateur'}
                          size="small"
                          color={user.role === 'chef_projet' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.jobTitle || 'Non renseigné'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{user.telephone || 'Non renseigné'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PermissionsIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Chip
                            label={`${user.permissions ? user.permissions.length : 0} permission${
                              user.permissions && user.permissions.length > 1 ? 's' : ''
                            }`}
                            size="small"
                            color="info"
                            onClick={() => handleOpenPermissionsModal(user)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Switch
                            checked={user.isActive}
                            onChange={() => handleToggleActive(user.id)}
                            color="success"
                          />
                          <Chip
                            label={user.isActive ? 'Actif' : 'Inactif'}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => handleEditUser(user.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
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

      {/* Modal de création/édition d'utilisateur */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" fontWeight="bold">
            {editMode ? 'Modifier un utilisateur' : 'Créer un nouvel utilisateur'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prénom"
                    fullWidth
                    value={newUser.prenom}
                    onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={newUser.nom}
                    onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={editMode ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                    type="password"
                    fullWidth
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required={!editMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Téléphone"
                    fullWidth
                    value={newUser.telephone}
                    onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Job Title"
                    fullWidth
                    value={newUser.jobTitle}
                    onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      value={newUser.role}
                      label="Rôle"
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setNewUser({
                          ...newUser,
                          role: newRole,
                        });
                      }}
                    >
                      <MenuItem value="user" disabled={!hasCreateUserPermission}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1 }} />
                          Utilisateur
                        </Box>
                      </MenuItem>
                      <MenuItem value="chef_projet" disabled={!hasCreateProjectManagerPermission}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChefProjetIcon sx={{ mr: 1 }} />
                          Chef de Projet
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Partie droite pour les permissions */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PermissionsIcon sx={{ mr: 1 }} />
                  Autorisations
                </Box>
              </Typography>

              {Object.keys(permissionsGroups).map((groupKey) => {
                const group = permissionsGroups[groupKey];
                return (
                  <Paper key={groupKey} variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
                      {group.icon}
                      <Box component="span" sx={{ ml: 1 }}>{group.title}</Box>
                    </Typography>

                    <FormGroup>
                      {group.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={
                            <Checkbox
                              checked={isPermissionChecked(permission.id)}
                              onChange={handlePermissionCheckboxChange}
                              name={permission.id}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{permission.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Paper>
                );
              })}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined">
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={
              (newUser.role === 'chef_projet' && !hasCreateProjectManagerPermission) ||
              (newUser.role === 'user' && !hasCreateUserPermission)
            }
          >
            {editMode ? 'Enregistrer modifications' : 'Créer utilisateur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de gestion des autorisations */}
      <Dialog open={openPermissionsModal} onClose={() => setOpenPermissionsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PermissionsIcon sx={{ mr: 1 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              Gérer les autorisations pour {selectedUserForPermissions?.email}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {Object.keys(permissionsGroups).map((groupKey) => {
            const group = permissionsGroups[groupKey];
            return (
              <Paper key={groupKey} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
                  {group.icon}
                  <Box component="span" sx={{ ml: 1 }}>{group.title}</Box>
                </Typography>

                <FormGroup>
                  {group.permissions.map((permission) => (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Checkbox
                          checked={isPermissionCheckedInModal(permission.id)}
                          onChange={() => handlePermissionChange(permission.id)}
                          name={permission.id}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{permission.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Paper>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenPermissionsModal(false)} variant="outlined">
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSavePermissions}>
            Enregistrer les modifications
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default AdminDashboard;