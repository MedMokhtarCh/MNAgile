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
  CircularProgress,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useProject } from '../hooks/useProjects';
import { useAvatar } from '../hooks/useAvatar';
import { useAuth } from '../contexts/AuthContext';
import AlertUser from '../components/common/AlertUser';
import ProjectCard from '../components/project/ProjectCard';
import ProjectFormStepper from '../components/project/ProjectFormStepper';
import PageTitle from '../components/common/PageTitle';
import Pagination from '../components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import { CreateButton, FilterContainer } from '../components/project/theme';


function Projects() {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
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
    observers,
    setObservers,
    selectedProject,
    menuAnchorEl,
    steps,
    status,
    getFilteredProjects,
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
  const { generateInitials, getAvatarColor } = useAvatar();
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 9;

  // Redirect if user lacks CanViewProjects
  useEffect(() => {
    if (!currentUser?.claims?.includes('CanViewProjects','CanAddProjects','CanEditProjects','CanDeleteProjects',)) {
      navigate('/no-access', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    setErrorAlertOpen(!!formError);
  }, [formError]);

  useEffect(() => {
    setSuccessAlertOpen(!!formSuccess);
  }, [formSuccess]);

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

  const navigateToProject = (projectId, section = '') => {
    if (!projectId) {
      console.error('Project ID is undefined');
      return;
    }
    const path = section ? `/project/${String(projectId)}/${section}` : `/project/${String(projectId)}`;
    navigate(path);
  };

  const getUserDisplayName = (email) => {
    const user = registeredUsers.find((u) => u.email === email);
    if (!user) return 'Utilisateur inconnu';
    if (user.nom && user.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user.name || user.email || 'Utilisateur inconnu';
  };

  const getShortDescription = (description) => {
    if (!description) return 'Aucune description';
    const words = description.trim().split(/\s+/);
    return words.length > 4 ? `${words.slice(0, 4).join(' ')}...` : words.join(' ');
  };

  const filteredProjects = getFilteredProjects();
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projectsPerPage));
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  // Only render if user has CanViewProjects
  if (!currentUser?.claims?.includes('CanViewProjects')) {
    return null; // Or render a fallback UI
  }

  return (
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
        {currentUser?.claims?.includes('CanAddProjects') && (
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
          <FormControl variant="outlined">
            <InputLabel>Trier par</InputLabel>
            <Select
              label="Trier par"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ bgcolor: theme.palette.background.default }}
            >
              <MenuItem value="desc">Plus récent</MenuItem>
              <MenuItem value="asc">Plus ancien</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </FilterContainer>

      <Box sx={{ mt: 4 }}>
        <PageTitle variant="h5">
          Liste des Projets
          {filteredProjects.length > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 2, fontWeight: 'normal' }}
            >
              ({indexOfFirstProject + 1} -{' '}
              {Math.min(indexOfLastProject, filteredProjects.length)} sur{' '}
              {filteredProjects.length})
            </Typography>
          )}
        </PageTitle>

        {status === 'loading' ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '500px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : status === 'failed' ? (
          <Box sx={{ gridColumn: 'span 3', textAlign: 'center', py: 5 }}>
            <Typography color="error">
              Impossible de charger les projets : {formError}
            </Typography>
          </Box>
        ) : (
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
              minHeight: '500px',
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
        )}

        {filteredProjects.length > 0 && status !== 'loading' && status !== 'failed' && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={handlePageChange}
            />
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {currentUser?.claims?.includes('CanEditProjects') && (
          <MenuItem
            onClick={() => {
              handleModalOpen(true, selectedProject);
              handleMenuClose();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
        )}
        {currentUser?.claims?.includes('CanDeleteProjects') && (
          <MenuItem
            onClick={() => {
              handleDeleteDialogOpen(selectedProject);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la Suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "
            {projectToDelete?.title}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleDeleteProject}
            color="error"
            autoFocus
            disabled={status === 'loading'}
          >
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
        observers={observers}
        setObservers={setObservers}
        productOwners={productOwners}
        setProductOwners={setProductOwners}
        scrumMasters={scrumMasters}
        setScrumMasters={setScrumMasters}
        developers={developers}
        setDevelopers={setDevelopers}
        testers={testers}
        setTesters={setTesters}
        getAvatarColor={getAvatarColor}
        generateInitials={generateInitials}
        formError={formError}
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
  );
}

export default Projects;