import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Drawer,
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  IconButton,
  MenuItem,
  Select,
  Chip,
  FormControl,
  InputLabel,
  Menu
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';

// Styled components
const ProjectCard = styled(Card)({
  width: 250,
  margin: 10,
  backgroundColor: '#f8f9fa',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  }
});

const UserAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  marginRight: 5,
});

const CreateButton = styled(Button)({
  textTransform: 'none',
  backgroundColor: '#fff',
  color: '#0066cc',
  border: '1px solid #e0e0e0',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  }
});

const FormButton = styled(Button)({
  width: '100%',
  margin: '10px 0',
  textTransform: 'none',
});

// Simulated users data
const availableUsers = [
  { id: 1, name: 'John Doe', email: 'john@gmail.com', avatar: '/path/to/john-avatar.jpg' },
  { id: 2, name: 'Jane Smith', email: 'jane@gmail.com', avatar: '/path/to/jane-avatar.jpg' },
  { id: 3, name: 'Mike Johnson', email: 'mike@gmail.com', avatar: '/path/to/mike-avatar.jpg' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@gmail.com', avatar: '/path/to/sarah-avatar.jpg' },
];

function Projects() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([
    {
      title: 'app mobile shopy',
      description: 'app Ecommerce mobile',
      users: [1, 2]  // User IDs
    },
    {
      title: 'Projet devops',
      description: 'test and integration',
      users: [2, 3]
    }
  ]);
  const [formData, setFormData] = useState({
    developers: [],
    projectManager: [],
    scrumMaster: [],
    productOwner: []
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(null);

  const handleOpenMenu = (event, index) => {
    setAnchorEl(event.currentTarget);
    setCurrentProjectIndex(index);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setCurrentProjectIndex(null);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleUserSelection = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleShareProject = () => {
    alert(`Project "${projects[currentProjectIndex].title}" shared!`);
    handleCloseMenu();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Projets</Typography>
        <CreateButton 
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          CRÉER UN NOUVEAU PROJET
        </CreateButton>
      </Box>

      <Typography sx={{ mb: 2 }}>Liste des projets</Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {projects.map((project, index) => (
          <ProjectCard key={index}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: 16 }}>{project.title}</Typography>
                  <Typography color="textSecondary" sx={{ fontSize: 14 }}>{project.description}</Typography>
                </Box>
                <IconButton size="small" onClick={(event) => handleOpenMenu(event, index)}>
                  <MoreHorizIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {project.users.map(userId => {
                  const user = availableUsers.find(u => u.id === userId);
                  return user ? (
                    <UserAvatar key={user.id} src={user.avatar} alt={user.name} />
                  ) : null;
                })}
              </Box>
            </CardContent>
          </ProjectCard>
        ))}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        sx={{ zIndex: 1300 }} // To ensure it's above other components
      >
        <MenuItem onClick={handleCloseMenu}>Modifier le projet</MenuItem>
        <MenuItem onClick={handleShareProject}>Partager le projet</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Autre action</MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: '800px',
            padding: '20px',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Créer un projet</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          label="Nom projet"
          placeholder="Entrer le nom du projet"
          sx={{ mb: 3 }}
        />
        
        <TextField
          fullWidth
          label="description"
          placeholder="Entrer la description"
          multiline
          rows={3}
          sx={{ mb: 3 }}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Développeurs</InputLabel>
          <Select
            multiple
            value={formData.developers}
            onChange={(e) => handleUserSelection('developers', e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip 
                    key={value}
                    label={availableUsers.find(user => user.id === value)?.name}
                    icon={<UserAvatar src={availableUsers.find(user => user.id === value)?.avatar} />}
                  />
                ))}
              </Box>
            )}
          >
            {availableUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <UserAvatar src={user.avatar} />
                <Typography sx={{ ml: 1 }}>{user.name} ({user.email})</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chef projet</InputLabel>
          <Select
            multiple
            value={formData.projectManager}
            onChange={(e) => handleUserSelection('projectManager', e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip 
                    key={value}
                    label={availableUsers.find(user => user.id === value)?.name}
                    icon={<UserAvatar src={availableUsers.find(user => user.id === value)?.avatar} />}
                  />
                ))}
              </Box>
            )}
          >
            {availableUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <UserAvatar src={user.avatar} />
                <Typography sx={{ ml: 1 }}>{user.name} ({user.email})</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormButton variant="contained" onClick={handleClose}>Enregistrer</FormButton>
      </Drawer>
    </Box>
  );
}

export default Projects;
