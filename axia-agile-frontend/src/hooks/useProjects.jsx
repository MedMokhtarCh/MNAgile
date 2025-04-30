import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useUsers } from './useUsers';
import { useNotification } from './useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { validateProject } from '../utils/validators';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  clearError,
} from '../store/slices/projectsSlice';
import { fetchCurrentUser } from '../store/slices/authSlice';

export const useProject = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { users } = useUsers('users');
  const { createNotification } = useNotification();
  const { currentUser, isAuthenticated, logout, hasRole } = useAuth();

  const { projects, status, error } = useSelector((state) => state.projects);
  const authState = useSelector((state) => state.auth);

  const [projectForm, setProjectForm] = useState({
    id: '',
    title: '',
    description: '',
    method: '',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [projectManagers, setProjectManagers] = useState([]);
  const [productOwners, setProductOwners] = useState([]);
  const [scrumMasters, setScrumMasters] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [testers, setTesters] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const steps = ['Informations Projet', 'Équipe Projet', 'Confirmation'];

  // Validate session on mount
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.loading) {
      dispatch(fetchCurrentUser()).catch((err) => {
        if (err.status === 401) {
          logout();
          navigate('/login', { replace: true });
        }
      });
    }
  }, [dispatch, navigate, logout, authState.isAuthenticated, authState.loading]);

  // Fetch projects after session validation
  useEffect(() => {
    if (authState.isAuthenticated && currentUser && !authState.loading) {
      dispatch(fetchProjects()).catch((err) => {
        if (err.status === 401) {
          logout();
          navigate('/login', { replace: true });
        }
      });
    } else if (!authState.loading && !authState.isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [
    navigate,
    dispatch,
    authState.isAuthenticated,
    currentUser,
    logout,
    authState.loading,
  ]);

  // Handle errors
  useEffect(() => {
    if (error) {
      let message = 'Échec de l\'opération';
      if (typeof error === 'object' && error !== null) {
        message =
          error.title ||
          error.message ||
          error.detail ||
          (error.errors ? JSON.stringify(error.errors) : null) ||
          'Une erreur est survenue lors de l\'opération';
      } else if (typeof error === 'string') {
        message = error;
      }
      setFormError(message);

      if (error?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    } else {
      setFormError('');
    }
  }, [error, navigate, logout]);

  const getFilteredProjects = useCallback(() => {
    let filteredProjects = [...projects];

    if (searchQuery) {
      filteredProjects = filteredProjects.filter((project) =>
        project.title?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
    }

    if (dateFilter) {
      filteredProjects = filteredProjects.filter(
        (project) => project.createdAt.split('T')[0] === dateFilter
      );
    }

    filteredProjects.sort((a, b) => {
      const dateA = new Date(a.createdAt || '1970-01-01');
      const dateB = new Date(b.createdAt || '1970-01-01');
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filteredProjects;
  }, [projects, searchQuery | dateFilter, sortOrder]);

  const navigateToProject = useCallback(
    (projectId) => {
      navigate(`/project/${projectId}`);
    },
    [navigate]
  );

  const handleModalOpen = useCallback(
    (editMode = false, project = null) => {
      if (!hasRole(['Admin', 'ChefProjet'])) {
        setFormError('Vous n\'avez pas les autorisations nécessaires.');
        return;
      }

      setIsEditing(editMode);
      setFormError('');
      setFormSuccess('');
      setActiveStep(0);

      if (editMode && project) {
        setProjectForm({
          id: project.id || '',
          title: project.title || '',
          description: project.description || '',
          method: project.method || '',
          startDate: project.startDate || new Date().toISOString(),
          endDate: project.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        });

        const getUsersByEmails = (emails) =>
          users.filter((user) => emails?.includes(user.email)) || [];

        setProjectManagers(getUsersByEmails(project.projectManagers));
        setProductOwners(getUsersByEmails(project.productOwners));
        setScrumMasters(getUsersByEmails(project.scrumMasters));
        setDevelopers(getUsersByEmails(project.users));
        setTesters(getUsersByEmails(project.testers));
      } else {
        setProjectForm({
          id: '',
          title: '',
          description: '',
          method: '',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        });
        setProjectManagers([]);
        setProductOwners([]);
        setScrumMasters([]);
        setDevelopers([]);
        setTesters([]);
      }

      setModalOpen(true);
    },
    [users, hasRole]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setIsEditing(false);
    setFormError('');
    setFormSuccess('');
    setActiveStep(0);
    setProjectForm({
      id: '',
      title: '',
      description: '',
      method: '',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    });
    setProjectManagers([]);
    setProductOwners([]);
    setScrumMasters([]);
    setDevelopers([]);
    setTesters([]);
    dispatch(clearError());
  }, [dispatch]);

  const handleDeleteDialogOpen = useCallback((project) => {
    if (!hasRole(['Admin', 'ChefProjet'])) {
      setFormError('Vous n\'avez pas les autorisations nécessaires.');
      return;
    }
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, [hasRole]);

  const handleDeleteDialogClose = useCallback(() => {
    setProjectToDelete(null);
    setDeleteDialogOpen(false);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      await dispatch(deleteProject(projectToDelete.id)).unwrap();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);

      if (currentUser?.email && projectToDelete?.title) {
        createNotification({
          recipient: currentUser.email,
          type: 'project',
          message: `Le projet "${projectToDelete.title}" a été supprimé.`,
          metadata: { projectId: projectToDelete.id },
        });
      }
    } catch (err) {
      setFormError(
        typeof err === 'string' ? err : 'Échec de la suppression du projet'
      );
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  }, [projectToDelete, currentUser, createNotification, dispatch, logout, navigate]);

  const handleNext = useCallback(() => {
    if (activeStep >= steps.length - 1) return;

    let errors = [];
    if (activeStep === 0) {
      errors = validateProject(projectForm, { projectManagers }, isEditing);
    } else if (activeStep === 1) {
      if (projectManagers.length === 0) {
        errors.push('Au moins un chef de projet doit être assigné');
      }
    }

    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }

    setActiveStep((prev) => prev + 1);
    setFormError('');
  }, [activeStep, projectForm, projectManagers, steps.length, isEditing]);

  const handleBack = useCallback(() => {
    if (activeStep <= 0) return;
    setActiveStep((prev) => prev - 1);
    setFormError('');
  }, [activeStep]);

  const notifyProjectUsers = useCallback(
    (projectData, isEditing) => {
      const projectTitle = projectData.title;
      const projectId = projectData.id;

      const notifyUsersByRole = (users, roleName) => {
        users.forEach((userEmail) => {
          if (userEmail !== currentUser?.email) {
            createNotification({
              recipient: userEmail,
              type: 'project',
              message: isEditing
                ? `Vous avez été ${
                    roleName === 'développeur' ? 'assigné' : 'assignée'
                  } en tant que ${roleName} au projet "${projectTitle}" récemment mis à jour.`
                : `Vous avez été ${
                    roleName === 'développeur' ? 'assigné' : 'assignée'
                  } en tant que ${roleName} au nouveau projet "${projectTitle}".`,
              sender: {
                name: currentUser?.nom
                  ? `${currentUser.nom} ${currentUser.prenom}`
                  : 'Système',
                avatar: null,
              },
              metadata: { projectId },
            });
          }
        });
      };

      notifyUsersByRole(projectData.projectManagers || [], 'chef de projet');
      notifyUsersByRole(projectData.productOwners || [], 'product owner');
      notifyUsersByRole(projectData.scrumMasters || [], 'scrum master');
      notifyUsersByRole(projectData.developers || [], 'développeur');
      notifyUsersByRole(projectData.testers || [], 'testeur');
    },
    [createNotification, currentUser]
  );

  const handleSaveProject = useCallback(async () => {
    const team = {
      projectManagers,
      productOwners,
      scrumMasters,
      developers,
      testers,
    };

    const errors = validateProject(projectForm, team, isEditing);
    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }

    const projectData = {
      id: isEditing ? projectForm.id : undefined,
      title: projectForm.title,
      description: projectForm.description,
      methodology: projectForm.method,
      createdAt: isEditing
        ? projects.find((p) => p.id.toString() === projectForm.id)?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      createdBy: currentUser?.email || '',
      projectManager: projectManagers[0]?.email || '',
      productOwner: productOwners[0]?.email || '',
      scrumMaster: scrumMasters[0]?.email || '',
      developers: developers.map((dev) => dev.email),
      testers: testers.map((tester) => tester.email),
    };

    try {
      if (isEditing) {
        await dispatch(
          updateProject({ id: projectForm.id, project: projectData })
        ).unwrap();
      } else {
        const response = await dispatch(createProject(projectData)).unwrap();
        projectData.id = response.id;
      }

      createNotification({
        recipient: currentUser.email,
        type: 'project',
        message: `Projet "${projectData.title}" ${
          isEditing ? 'mis à jour' : 'créé'
        } avec succès`,
        metadata: { projectId: projectData.id },
      });

      notifyProjectUsers(projectData, isEditing);

      setFormSuccess(
        isEditing
          ? 'Projet mis à jour avec succès !'
          : 'Projet créé avec succès !'
      );

      setTimeout(() => {
        handleModalClose();
      }, 1500);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err.title ||
            err.message ||
            err.detail ||
            (err.errors ? JSON.stringify(err.errors) : 'Échec de la sauvegarde du projet');
      setFormError(errorMessage);
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  }, [
    projectForm,
    projectManagers,
    productOwners,
    scrumMasters,
    developers,
    testers,
    isEditing,
    projects,
    currentUser,
    createNotification,
    handleModalClose,
    notifyProjectUsers,
    dispatch,
    logout,
    navigate,
  ]);

  const handleMenuOpen = useCallback(
    (event, project) => {
      setSelectedProject(project);
      setMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedProject(null);
  }, []);

  return {
    projects,
    status,
    currentUser,
    registeredUsers: users,
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
  };
};