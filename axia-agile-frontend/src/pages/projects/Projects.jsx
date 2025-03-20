import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  IconButton,
  MenuItem,
  Select,
  Avatar,
  Autocomplete,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  ListItem,
  ListItemAvatar,
  ListItemText,
  List,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  AppBar,
  Toolbar,
  Container,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  Fade
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';

// Transition component for modal
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Styled components
const ProjectCard = styled(Card)({
  width: 300,
  margin: 16,
  backgroundColor: '#f8f9fa',
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderRadius: 12,
  overflow: 'hidden',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  }
});

const UserAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  marginRight: 5,
  fontSize: '12px',
  backgroundColor: '#3f51b5'
});

const CreateButton = styled(Button)({
  textTransform: 'none',
  backgroundColor: '#0066cc',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0, 102, 204, 0.2)',
  '&:hover': {
    backgroundColor: '#004c99',
    boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
  }
});

const FormButton = styled(Button)({
  margin: '10px 8px',
  textTransform: 'none',
  padding: '10px 24px',
  borderRadius: 8,
  fontWeight: 600,
});

const StepperContainer = styled(Box)({
  marginBottom: 24,
  marginTop: 16,
  padding: '8px 0',
});

const FormSection = styled(Box)({
  padding: '16px 0',
  minHeight: '300px',
  width:'800px',
});

const SectionTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: 16,
  color: '#333',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: '#0066cc',
  }
});

const UserSuggestion = styled(Paper)({
  padding: 0,
  marginTop: 8,
  maxHeight: 200,
  overflow: 'auto',
  borderRadius: 8,
});

function Projects() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [modalOpen, setModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [developers, setDevelopers] = useState([]);
  const [projectManager, setProjectManager] = useState(null);
  const [productOwner, setProductOwner] = useState(null);
  const [scrumMaster, setScrumMaster] = useState(null);
  const [testers, setTesters] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectForm, setProjectForm] = useState({
    id: '',
    title: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Steps for project creation/edit
  const steps = ['Informations du projet', 'Équipe du projet', 'Confirmation'];

  // Récupérer le rôle de l'utilisateur actuel
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
  }, []);

  const role = currentUser?.role; // Rôle de l'utilisateur (chef_projet, user, etc.)

  // Navigation function to view project details
  const navigateToProject = (project) => {
    navigate(`/project/${project.id}`);
  };

  // Load user data and projects on component mount
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    // Load registered users
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    setRegisteredUsers(storedUsers.map(user => ({
      id: user.email, // Using email as unique ID
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      company: user.company
    })));

    // Load projects from localStorage
    const storedProjects = JSON.parse(localStorage.getItem('projects')) || [];
    setProjects(storedProjects);
  }, [navigate]);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => !dateFilter || project.createdAt === dateFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const handleModalOpen = (isEdit = false, project = null) => {
    if (isEdit && role !== 'chef_projet') {
      return; // Empêche les utilisateurs non autorisés de modifier des projets
    }
    setIsEditing(isEdit);
    setModalOpen(true);
    setFormError('');
    setFormSuccess('');
    setActiveStep(0);
    
    if (isEdit && project) {
      // Set form values for editing
      setProjectForm({
        id: project.id,
        title: project.title,
        description: project.description
      });
      
      // Set developers
      const projectDevs = project.users?.map(email => {
        const user = registeredUsers.find(u => u.email === email);
        return user || { email, name: email };
      }) || [];
      setDevelopers(projectDevs);
      
      // Set project manager
      const manager = registeredUsers.find(u => u.email === project.projectManager);
      setProjectManager(manager || { email: project.projectManager, name: project.projectManager });
      
      // Set new team roles
      const owner = registeredUsers.find(u => u.email === project.productOwner);
      setProductOwner(owner || null);
      
      const master = registeredUsers.find(u => u.email === project.scrumMaster);
      setScrumMaster(master || null);
      
      const projectTesters = project.testers?.map(email => {
        const user = registeredUsers.find(u => u.email === email);
        return user || { email, name: email };
      }) || [];
      setTesters(projectTesters);
    } else {
      // Reset form for new project
      setProjectForm({ id: '', title: '', description: '' });
      setDevelopers([]);
      setProjectManager(null);
      setProductOwner(null);
      setScrumMaster(null);
      setTesters([]);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleDeleteDialogOpen = (project) => {
    if (role !== 'chef_projet') {
      return; // Empêche les utilisateurs non autorisés de supprimer des projets
    }
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleDeleteProject = () => {
    if (!projectToDelete) return;
    
    // Filter out the project to delete
    const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
    
    // Save to localStorage
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
    
    // Close dialog
    handleDeleteDialogClose();
  };
  
  const handleNext = () => {
    // Allow navigation between steps without validation
    setActiveStep((prevStep) => prevStep + 1);
    setFormError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setFormError('');
  };

  const handleSaveProject = () => {
    // Validate form only at the final saving step
    if (!projectForm.title || !projectForm.description) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      setActiveStep(0);
      return;
    }

    if (!projectManager) {
      setFormError('Veuillez sélectionner un chef de projet');
      setActiveStep(1);
      return;
    }

    if (isEditing) {
      // Update existing project
      const updatedProjects = projects.map(project => {
        if (project.id === projectForm.id) {
          return {
            ...project,
            title: projectForm.title,
            description: projectForm.description,
            users: developers.map(dev => dev.email),
            projectManager: projectManager.email,
            // Add new team roles
            productOwner: productOwner?.email || '',
            scrumMaster: scrumMaster?.email || '',
            testers: testers.map(tester => tester.email)
          };
        }
        return project;
      });
      
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setFormSuccess('Projet mis à jour avec succès!');
    } else {
      // Create new project
      const newProject = {
        id: Date.now().toString(), // Simple unique ID
        title: projectForm.title,
        description: projectForm.description,
        users: developers.map(dev => dev.email),
        projectManager: projectManager.email,
        // Add new team roles
        productOwner: productOwner?.email || '',
        scrumMaster: scrumMaster?.email || '',
        testers: testers.map(tester => tester.email),
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser.email
      };

      // Save to localStorage
      const updatedProjects = [...projects, newProject];
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setFormSuccess('Projet créé avec succès!');
    }
    
    // Close modal after success
    setTimeout(() => {
      handleModalClose();
    }, 1500);
  };

  const getUserDisplayName = (email) => {
    const user = registeredUsers.find(u => u.email === email);
    return user ? user.name : email;
  };

  // Handle email search for user assignment
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Filter users based on email containing the search term
    const results = registeredUsers.filter(user => 
      user.email.toLowerCase().includes(term.toLowerCase()) ||
      user.name.toLowerCase().includes(term.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Add user from search results to developers
  const handleAddUser = (user, role = 'developer') => {
    switch (role) {
      case 'developer':
        if (!developers.some(dev => dev.email === user.email)) {
          setDevelopers([...developers, user]);
        }
        break;
      case 'tester':
        if (!testers.some(tester => tester.email === user.email)) {
          setTesters([...testers, user]);
        }
        break;
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  // Generate avatar with initials
  const generateInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Get background color for avatar based on name
  const getAvatarColor = (name) => {
    const colors = ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800', '#ff5722', '#795548'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Menu handling
  const handleMenuOpen = (event, project) => {
    event.stopPropagation(); // Prevent card click when opening menu
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Render different steps in the form
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={2}>
              <DescriptionIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Informations du projet</Typography>
            </Box>
            <TextField 
              fullWidth 
              label="Nom projet" 
              placeholder="Entrer le nom du projet" 
              variant="outlined"
              sx={{ mb: 3 }} 
              value={projectForm.title}
              onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
              required
            />
            
            <TextField 
              fullWidth 
              label="Description" 
              placeholder="Entrer la description" 
              multiline 
              rows={5} 
              variant="outlined"
              sx={{ mb: 3 }} 
              value={projectForm.description}
              onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
              required
            />
          </FormSection>
        );
      case 1:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={2}>
              <GroupIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Équipe du projet</Typography>
            </Box>
            
            <Autocomplete
              options={registeredUsers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option?.email === value?.email}
              onChange={(event, value) => setProjectManager(value)}
              value={projectManager}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Chef de projet" 
                  placeholder="Sélectionner un chef de projet" 
                  variant="outlined"
                  sx={{ mb: 3 }} 
                />
              )}
            />
            
            {/* Product Owner */}
            <Autocomplete
              options={registeredUsers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option?.email === value?.email}
              onChange={(event, value) => setProductOwner(value)}
              value={productOwner}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Product Owner" 
                  placeholder="Sélectionner un Product Owner" 
                  variant="outlined"
                  sx={{ mb: 3 }} 
                />
              )}
            />
            
            {/* Scrum Master */}
            <Autocomplete
              options={registeredUsers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option?.email === value?.email}
              onChange={(event, value) => setScrumMaster(value)}
              value={scrumMaster}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Scrum Master" 
                  placeholder="Sélectionner un Scrum Master" 
                  variant="outlined"
                  sx={{ mb: 3 }} 
                />
              )}
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Ajouter des développeurs</Typography>
            <TextField
              fullWidth
              placeholder="Rechercher par email ou nom"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
              }}
              sx={{ mb: 1 }}
            />
            
            {searchResults.length > 0 && (
              <UserSuggestion elevation={3}>
                <List dense>
                  {searchResults.map(user => (
                    <ListItem 
                      button 
                      key={user.email} 
                      onClick={() => handleAddUser(user, 'developer')}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f0f7ff'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getAvatarColor(user.name) }}>
                          {generateInitials(user.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.name} 
                        secondary={user.email}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </UserSuggestion>
            )}
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Développeurs sélectionnés ({developers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
              {developers.length > 0 ? developers.map(dev => (
                <Chip
                  key={dev.email}
                  avatar={
                    <Avatar sx={{ bgcolor: getAvatarColor(dev.name) }}>
                      {generateInitials(dev.name)}
                    </Avatar>
                  }
                  label={`${dev.name}`}
                  onDelete={() => setDevelopers(developers.filter(d => d.email !== dev.email))}
                  sx={{ margin: '0 8px 8px 0' }}
                />
              )) : (
                <Typography variant="body2" color="textSecondary">
                  Aucun développeur sélectionné
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Testers section */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Ajouter des testeurs</Typography>
            <TextField
              fullWidth
              placeholder="Rechercher par email ou nom"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
              }}
              sx={{ mb: 1 }}
            />
            
            {searchResults.length > 0 && (
              <UserSuggestion elevation={3}>
                <List dense>
                  {searchResults.map(user => (
                    <ListItem 
                      button 
                      key={`tester-${user.email}`} 
                      onClick={() => handleAddUser(user, 'tester')}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f0f7ff'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getAvatarColor(user.name) }}>
                          {generateInitials(user.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.name} 
                        secondary={user.email}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </UserSuggestion>
            )}
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Testeurs sélectionnés ({testers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
              {testers.length > 0 ? testers.map(tester => (
                <Chip
                  key={`tester-chip-${tester.email}`}
                  avatar={
                    <Avatar sx={{ bgcolor: getAvatarColor(tester.name) }}>
                      {generateInitials(tester.name)}
                    </Avatar>
                  }
                  label={`${tester.name}`}
                  onDelete={() => setTesters(testers.filter(t => t.email !== tester.email))}
                  sx={{ margin: '0 8px 8px 0' }}
                />
              )) : (
                <Typography variant="body2" color="textSecondary">
                  Aucun testeur sélectionné
                </Typography>
              )}
            </Box>
          </FormSection>
        );
      case 2:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={3}>
              <SaveIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Récapitulatif du projet</Typography>
            </Box>
            
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Informations du projet
              </Typography>
              <Box sx={{ mt: 1, mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  Nom: {projectForm.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Description: {projectForm.description}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Équipe du projet
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                  Chef de projet: {projectManager?.name || 'Non spécifié'}
                </Typography>
                
                <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                  Product Owner: {productOwner?.name || 'Non spécifié'}
                </Typography>
                
                <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                  Scrum Master: {scrumMaster?.name || 'Non spécifié'}
                </Typography>
                
                <Typography variant="body2" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                  <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                  Développeurs ({developers.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {developers.length > 0 ? developers.map(dev => (
                    <Chip
                      key={dev.email}
                      avatar={
                        <Avatar sx={{ bgcolor: getAvatarColor(dev.name) }}>
                          {generateInitials(dev.name)}
                        </Avatar>
                      }
                      label={dev.name}
                      variant="outlined"
                      size="small"
                      sx={{ margin: '0 4px 4px 0' }}
                    />
                  )) : (
                    <Typography variant="body2" color="textSecondary">
                      Aucun développeur sélectionné
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="body2" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                  <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                  Testeurs ({testers.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {testers.length > 0 ? testers.map(tester => (
                    <Chip
                      key={`tester-summary-${tester.email}`}
                      avatar={
                        <Avatar sx={{ bgcolor: getAvatarColor(tester.name) }}>
                          {generateInitials(tester.name)}
                        </Avatar>
                      }
                      label={tester.name}
                      variant="outlined"
                      size="small"
                      sx={{ margin: '0 4px 4px 0' }}
                    />
                  )) : (
                    <Typography variant="body2" color="textSecondary">
                      Aucun testeur sélectionné
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </FormSection>
        );
      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Gestion des Projets</Typography>
        {role === 'chef_projet' && (
          <CreateButton startIcon={<AddIcon />} onClick={() => handleModalOpen(false)}>
            CRÉER UN NOUVEAU PROJET
          </CreateButton>
        )}
      </Box>

      {/* Filter Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <TextField
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          sx={{ width: 200 }}
          InputLabelProps={{
            shrink: true,
          }}
          label="Filtrer par date"
        />

        <FormControl sx={{ width: 200 }}>
          <InputLabel>Trier par</InputLabel>
          <Select
            label="Trier par"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <MenuItem value="desc">Plus récent</MenuItem>
            <MenuItem value="asc">Plus ancien</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Projects List */}
      <SectionTitle variant="h6">Liste des Projets</SectionTitle>
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id}
              onClick={() => navigateToProject(project)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 'bold', color: '#0066cc' }}>{project.title}</Typography>
                    <Typography color="textSecondary" sx={{ fontSize: 14 }}>{project.description}</Typography>
                  </Box>
                  {role === 'chef_projet' && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: 12, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    Chef de projet: {getUserDisplayName(project.projectManager)}
                  </Typography>
                  
                  {project.productOwner && (
                    <Typography variant="body2" sx={{ fontSize: 12, mb: 1, display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Product Owner: {getUserDisplayName(project.productOwner)}
                    </Typography>
                  )}
                  
                  {project.scrumMaster && (
                    <Typography variant="body2" sx={{ fontSize: 12, mb: 1, display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Scrum Master: {getUserDisplayName(project.scrumMaster)}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ fontSize: 12, mb: 1 }}>
                    Créé le: {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mt: 2 }}>
                    {project.users && project.users.slice(0, 3).map((user, index) => (
                      <UserAvatar key={index} sx={{ backgroundColor: getAvatarColor(getUserDisplayName(user)) }}>
                        {generateInitials(getUserDisplayName(user))}
                      </UserAvatar>
                    ))}
                    {project.users && project.users.length > 3 && (
                      <UserAvatar>+{project.users.length - 3}</UserAvatar>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </ProjectCard>
          ))
        ) : (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Aucun projet trouvé
            </Typography>
          </Box>
        )}
      </Box>

      {/* Project Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {role === 'chef_projet' && (
          <MenuItem 
            onClick={() => {
              handleModalOpen(true, selectedProject);
              handleMenuClose();
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
        )}
        {role === 'chef_projet' && (
          <MenuItem 
            onClick={() => handleDeleteDialogOpen(selectedProject)}
            sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.title}"? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteProject} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Form Modal */}
      <Dialog
        fullScreen={isMobile}
        open={modalOpen}
        onClose={handleModalClose}
        maxWidth="md"
        TransitionComponent={Transition}
      >
        <AppBar position="relative" color="transparent" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleModalClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
              {isEditing ? 'Modifier Projet' : 'Créer Projet'}
            </Typography>
          </Toolbar>
        </AppBar>
        
        <DialogContent sx={{ p: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}
          
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {formSuccess}
            </Alert>
          )}
          
          <StepperContainer>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </StepperContainer>
          
          <Fade in={true}>
            <Box>
              {getStepContent(activeStep)}
            </Box>
          </Fade>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              <FormButton
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ChevronLeftIcon />}
                variant="outlined"
              >
                Précédent
              </FormButton>
            </Box>
            <Box>
              {activeStep === steps.length - 1 ? (
                <FormButton
                  onClick={handleSaveProject}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  color="primary"
                >
                  {isEditing ? 'Enregistrer' : 'Créer'}
                </FormButton>
              ) : (
                <FormButton
                  onClick={handleNext}
                  variant="contained"
                  endIcon={<ChevronRightIcon />}
                  color="primary"
                >
                  Suivant
                </FormButton>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;