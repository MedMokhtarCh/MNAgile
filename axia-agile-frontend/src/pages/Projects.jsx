import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useProject } from '../hooks/useProjects';
import { useNotification } from '../hooks/useNotifications';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import AlertUser from '../components/common/AlertUser';
import ProjectCard from '../components/common/ProjectCard';
import ProjectFormStepper from '../components/common/ProjectFormStepper';
import PageTitle from '../components/common/PageTitle';
import Pagination from '../components/common/Pagination'; 

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error">
          Erreur: {this.state.error.message}
        </Typography>
      );
    }
    return this.props.children;
  }
}

// Styled Components
const CreateButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.primary.contrastText,
  padding: '12px 28px',
  borderRadius: 12,
  boxShadow: theme.shadows[4],
  fontSize: 16,
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    boxShadow: theme.shadows[8],
    transform: 'scale(1.05)',
  },
  '& .MuiButton-startIcon': {
    marginRight: 10,
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '16px 24px',
  borderRadius: 12,
  boxShadow: theme.shadows[3],
  marginBottom: 32,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: 12,
  color: theme.palette.text.primary,
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -6,
    left: 0,
    width: 50,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  },
}));

function Projects() {
  const theme = useTheme();
  const {
    currentUser,
    registeredUsers,
    projectForm,
    setProjectForm,
    formError,
    formSuccess,
    isEditing,
    modalOpen,
    deleteDialogOpen,
    projectToDelete,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    activeStep,
    projectManagers,
    setProjectManagers,
    productOwners,
    setProductOwners,
    scrumMasters,
    setScrumMasters,
    developers,
    setDevelopers,
    testers,
    setTesters,
    selectedProject,
    menuAnchorEl,
    steps,
    getFilteredProjects,
    navigateToProject,
    handleModalOpen,
    handleModalClose,
    handleDeleteDialogOpen,
    handleDeleteDialogClose,
    handleDeleteProject,
    handleNext,
    handleBack,
    handleSaveProject,
    handleMenuOpen,
    handleMenuClose,
  } = useProject();
  const { createNotification } = useNotification();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users } = useUsers('users');
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 9; // Ajusté pour une grille 3x3 qui fonctionne bien visuellement

  useEffect(() => {
    if (formError) {
      setErrorAlertOpen(true);
    } else {
      setErrorAlertOpen(false);
    }
  }, [formError]);

  useEffect(() => {
    if (formSuccess) {
      setSuccessAlertOpen(true);
    } else {
      setSuccessAlertOpen(false);
    }
  }, [formSuccess]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, sortOrder]);

  const handleErrorAlertClose = () => {
    setErrorAlertOpen(false);
  };

  const handleSuccessAlertClose = () => {
    setSuccessAlertOpen(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? `${user.nom} ${user.prenom}` : email;
  };

  const getShortDescription = (description) => {
    if (!description) return 'Aucune description';
    const words = description.trim().split(/\s+/);
    return words.length > 4 ? `${words.slice(0, 4).join(' ')}...` : words.join(' ');
  };

  // Get filtered projects
  const filteredProjects = getFilteredProjects();
  
  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projectsPerPage));
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 5, px: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <PageTitle>Mes Projets</PageTitle>
          {currentUser?.role === 'chef_projet' && (
            <CreateButton
              startIcon={<AddIcon sx={{ fontSize: 26 }} />}
              onClick={() => handleModalOpen(false)}
            >
              Créer Nouveau Projet
            </CreateButton>
          )}
        </Box>

        <FilterContainer>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Filtres
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 2,
            }}
          >
            <TextField
              label="Rechercher par nom"
              placeholder="Nom du projet"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                ),
              }}
              sx={{ bgcolor: theme.palette.background.default }}
            />
            <TextField
              type="date"
              label="Filtrer par date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ bgcolor: theme.palette.background.default }}
            />
            <FormControl>
              <InputLabel>Trier par</InputLabel>
              <Select
                label="Trier par"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.default }}
              >
                <MenuItem value="desc">Plus récent</MenuItem>
                <MenuItem value="asc">Plus ancien</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </FilterContainer>

        <Box sx={{ mt: 4 }}>
          <SectionTitle variant="h5">
            Liste des Projets 
            {filteredProjects.length > 0 && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2, fontWeight: 'normal' }}>
                ({indexOfFirstProject + 1} - {Math.min(indexOfLastProject, filteredProjects.length)} sur {filteredProjects.length})
              </Typography>
            )}
          </SectionTitle>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 3,
              justifyItems: 'center',
              minHeight: '500px', // Espace minimum pour éviter les sauts de page
            }}
          >
            {currentProjects.length > 0 ? (
              currentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUser={currentUser}
                  handleMenuOpen={handleMenuOpen}
                  navigateToProject={navigateToProject}
                  getUserDisplayName={getUserDisplayName}
                  getShortDescription={getShortDescription}
                  getAvatarColor={getAvatarColor}
                  generateInitials={generateInitials}
                />
              ))
            ) : (
              <Box sx={{ gridColumn: 'span 3', textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucun projet trouvé
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Pagination component */}
          {filteredProjects.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                page={currentPage} 
                count={totalPages} 
                onChange={handlePageChange} 
              />
            </Box>
          )}
        </Box>

        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              handleModalOpen(true, selectedProject);
              handleMenuClose();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
          <MenuItem onClick={() => handleDeleteDialogOpen(selectedProject)} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Confirmer la Suppression</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.title}" ? Cette action est irréversible.
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

        <ProjectFormStepper
          open={modalOpen}
          onClose={handleModalClose}
          isEditing={isEditing}
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          activeStep={activeStep}
          steps={steps}
          handleBack={handleBack}
          handleNext={handleNext}
          handleSaveProject={handleSaveProject}
          registeredUsers={registeredUsers}
          projectManagers={projectManagers}
          setProjectManagers={setProjectManagers}
          productOwners={productOwners}
          setProductOwners={setProductOwners}
          scrumMasters={scrumMasters}
          setScrumMasters={setScrumMasters}
          developers={developers}
          setDevelopers={setDevelopers}
          testers={testers}
          setTesters={setTesters}
          createNotification={createNotification}
          getAvatarColor={getAvatarColor}
          generateInitials={generateInitials}
        />

        <AlertUser
          open={errorAlertOpen}
          onClose={handleErrorAlertClose}
          message={formError}
          severity="error"
          autoHideDuration={6000}
        />
        <AlertUser
          open={successAlertOpen}
          onClose={handleSuccessAlertClose}
          message={formSuccess}
          severity="success"
          autoHideDuration={1500}
        />
      </Container>
    </ErrorBoundary>
  );
}

export default Projects;