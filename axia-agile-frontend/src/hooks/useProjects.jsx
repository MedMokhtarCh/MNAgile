import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
import { fetchUsers } from '../store/slices/usersSlice';

export const useProject = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { createNotification } = useNotification();
  const { currentUser, isAuthenticated, logout } = useAuth();

  const { projects, status: projectsStatus, error } = useSelector((state) => state.projects);
  const { users, status: usersStatus } = useSelector((state) => state.users);

  // Filter active users only for project-related operations
  const activeUsers = users.filter(user => user.isActive);

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
  const [observers, setObservers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const steps = ['Informations Projet', 'Équipe Projet', 'Confirmation'];

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (!currentUser?.claims?.includes('CanViewProjects')) {
      setFormError("Vous n'avez pas les autorisations pour voir les projets.");
      navigate('/no-access', { replace: true });
      return;
    }

    // Fetch all users (as per usersSlice) and projects
    dispatch(fetchUsers()).catch((err) => {
      console.error('Failed to fetch users:', err);
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    });

    dispatch(fetchProjects()).catch((err) => {
      console.error('Failed to fetch projects:', err);
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    });
  }, [navigate, dispatch, isAuthenticated, currentUser, logout]);

  useEffect(() => {
    if (error) {
      const message =
        typeof error === 'object' && error !== null
          ? error.title ||
            error.message ||
            error.detail ||
            (error.errors ? JSON.stringify(error.errors) : null) ||
            'Une erreur est survenue lors de l\'opération'
          : error || 'Échec de l\'opération';
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

    if (currentUser?.email) {
      filteredProjects = filteredProjects.filter((project) => {
        const isCreator = project.createdBy === currentUser.email;
        const isAssigned = [
          ...(project.projectManagers || []),
          ...(project.productOwners || []),
          ...(project.scrumMasters || []),
          ...(project.users || []),
          ...(project.testers || []),
          ...(project.observers || []),
        ].includes(currentUser.email);
        return isCreator || isAssigned;
      });
    }

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
  }, [projects, searchQuery, dateFilter, sortOrder, currentUser]);

  const navigateToProject = useCallback(
    (projectId) => {
      navigate(`/project/${String(projectId)}`);
    },
    [navigate]
  );

  const handleModalOpen = useCallback(
    (editMode = false, project = null) => {
      if (!currentUser?.claims?.includes('CanViewProjects')) {
        setFormError("Vous n'avez pas les autorisations pour voir les projets.");
        return;
      }

      if (editMode && !currentUser?.claims?.includes('CanEditProjects')) {
        setFormError("Vous n'avez pas les autorisations pour modifier un projet.");
        return;
      }
      if (!editMode && !currentUser?.claims?.includes('CanAddProjects')) {
        setFormError("Vous n'avez pas les autorisations pour créer un projet.");
        return;
      }

      setIsEditing(editMode);
      setFormError('');
      setFormSuccess('');
      setActiveStep(0);

      if (editMode && project) {
        setProjectForm({
          id: String(project.id || ''),
          title: project.title || '',
          description: project.description || '',
          method: project.method || '',
          startDate: project.startDate || new Date().toISOString(),
          endDate:
            project.endDate ||
            new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        });

        const getUsersByEmails = (emails) =>
          activeUsers.filter((user) => emails?.includes(user.email)) || [];

        setProjectManagers(getUsersByEmails(project.projectManagers));
        setProductOwners(getUsersByEmails(project.productOwners));
        setScrumMasters(getUsersByEmails(project.scrumMasters));
        setDevelopers(getUsersByEmails(project.users));
        setTesters(getUsersByEmails(project.testers));
        setObservers(getUsersByEmails(project.observers));
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
        setObservers([]);
      }

      setModalOpen(true);
    },
    [activeUsers, currentUser]
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
    setObservers([]);
    dispatch(clearError());
  }, [dispatch]);

  const handleDeleteDialogOpen = useCallback((project) => {
    if (!currentUser?.claims?.includes('CanViewProjects')) {
      setFormError("Vous n'avez pas les autorisations pour voir les projets.");
      return;
    }
    if (!currentUser?.claims?.includes('CanDeleteProjects')) {
      setFormError("Vous n'avez pas les autorisations pour supprimer un projet.");
      return;
    }
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, [currentUser]);

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

      if (currentUser?.id && projectToDelete?.title) {
        await createNotification({
          userId: currentUser.id,
          type: 'project',
          message: `Le projet "${projectToDelete.title}" a été supprimé.`,
          relatedEntityType: 'Project',
          relatedEntityId: projectToDelete.id,
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
      // No validation changes needed here
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
    async (projectData, isEditing) => {
      // Wait for users to be fetched if still loading
      if (usersStatus === 'loading') {
        console.log('Waiting for users to load before sending notifications...');
        await new Promise((resolve) => {
          const checkUsers = setInterval(() => {
            if (usersStatus !== 'loading') {
              clearInterval(checkUsers);
              resolve();
            }
          }, 100);
        });
      }

      // Log available active users for debugging
      console.log('Available active users:', activeUsers.map(u => ({ id: u.id, email: u.email })));

      const projectTitle = projectData.title;
      const projectId = projectData.id;

      const notifyUsersByRole = async (emails, roleName) => {
        if (!emails || !Array.isArray(emails)) {
          console.warn(`Invalid or empty email array for role: ${roleName}`);
          return;
        }

        for (const userEmail of emails) {
          // Normalize email for comparison (handle case sensitivity)
          const normalizedEmail = userEmail?.toLowerCase()?.trim();
          if (!normalizedEmail) {
            console.warn(`Invalid email for role ${roleName}: ${userEmail}`);
            continue;
          }

          // Find user by email among active users
          const user = activeUsers.find((u) => u.email?.toLowerCase()?.trim() === normalizedEmail);
          if (!user || !user.id) {
            console.warn(`No valid active user found for email: ${userEmail} in role: ${roleName}`);
            continue;
          }

          // Skip notification for the current user to avoid duplicates
          if (normalizedEmail === currentUser?.email?.toLowerCase()?.trim()) {
            console.log(`Skipping notification for current user: ${userEmail}`);
            continue;
          }

          try {
            await createNotification({
              userId: user.id,
              type: 'project',
              message: isEditing
                ? `Vous avez été ${
                    roleName === 'développeur' ? 'assigné' : 'assignée'
                  } en tant que ${roleName} au projet "${projectTitle}" récemment mis à jour.`
                : `Vous avez été ${
                    roleName === 'développeur' ? 'assigné' : 'assignée'
                  } en tant que ${roleName} au nouveau projet "${projectTitle}".`,
              relatedEntityType: 'Project',
              relatedEntityId: projectId,
            });
            console.log(`Notification sent to user ${user.email} (ID: ${user.id}) for role: ${roleName}`);
          } catch (error) {
            console.error(`Failed to send notification to ${user.email}:`, error);
          }
        }
      };

      // Notify users by role
      await notifyUsersByRole(projectData.projectManagers || [], 'chef de projet');
      await notifyUsersByRole(projectData.productOwners || [], 'product owner');
      await notifyUsersByRole(projectData.scrumMasters || [], 'scrum master');
      await notifyUsersByRole(projectData.developers || [], 'développeur');
      await notifyUsersByRole(projectData.testers || [], 'testeur');
      await notifyUsersByRole(projectData.observers || [], 'observateur');

      // Dispatch newNotification event
      window.dispatchEvent(new Event('newNotification'));
    },
    [createNotification, currentUser, activeUsers, usersStatus]
  );

  const handleSaveProject = useCallback(async () => {
    if (!currentUser?.claims?.includes('CanViewProjects')) {
      setFormError("Vous n'avez pas les autorisations pour voir les projets.");
      return;
    }

    const team = {
      projectManagers,
      productOwners,
      scrumMasters,
      developers,
      testers,
      observers,
    };

    const errors = validateProject(projectForm, team, isEditing);
    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }

    const projectData = {
      title: projectForm.title,
      description: projectForm.description,
      methodology: projectForm.method,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      createdBy: currentUser?.email || '',
      projectManagers: projectManagers.map((pm) => pm.email),
      productOwners: productOwners.map((po) => po.email),
      scrumMasters: scrumMasters.map((sm) => sm.email),
      developers: developers.map((dev) => dev.email),
      testers: testers.map((tester) => tester.email),
      observers: observers.map((observer) => observer.email),
    };

    console.log('Saving Project Data:', projectData);

    try {
      let savedProject;

      if (isEditing) {
        projectData.id = parseInt(projectForm.id);
        savedProject = await dispatch(
          updateProject({ id: projectForm.id, project: projectData })
        ).unwrap();
      } else {
        savedProject = await dispatch(createProject(projectData)).unwrap();
      }

      await createNotification({
        userId: currentUser.id,
        type: 'project',
        message: `Projet "${savedProject.title}" ${
          isEditing ? 'mis à jour' : 'créé'
        } avec succès`,
        relatedEntityType: 'Project',
        relatedEntityId: savedProject.id,
      });

      // Notify assigned users
      await notifyProjectUsers(savedProject, isEditing);

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
          : err.message ||
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
    observers,
    isEditing,
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

  const getAvatarColor = useCallback((name) => {
    const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2'];
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const generateInitials = useCallback((name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, []);

  return {
    projects,
    status: projectsStatus,
    currentUser,
    registeredUsers: activeUsers, // Return only active users for project assignments
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
    getAvatarColor,
    generateInitials,
  };
};