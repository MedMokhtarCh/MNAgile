import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from './useUsers';
import { useNotification } from './useNotifications';
import { validateProject } from '../utils/validators';

export const useProject = () => {
  const navigate = useNavigate();
  const { users } = useUsers('users');
  const { createNotification } = useNotification();
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectForm, setProjectForm] = useState({
    id: '',
    title: '',
    description: '',
    method: '',
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
    } else {
      navigate('/auth', { replace: true });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }

    const storedProjects = JSON.parse(localStorage.getItem('projects')) || [];
    setProjects(storedProjects);
  }, [navigate]);

  const getFilteredProjects = useCallback(() => {
    let filteredProjects = [...projects];

    if (searchQuery) {
      filteredProjects = filteredProjects.filter((project) =>
        project.title?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
    }

    if (dateFilter) {
      filteredProjects = filteredProjects.filter(
        (project) => project.createdAt === dateFilter
      );
    }

    filteredProjects.sort((a, b) => {
      const dateA = new Date(a.createdAt || '1970-01-01');
      const dateB = new Date(b.createdAt || '1970-01-01');
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filteredProjects;
  }, [projects, searchQuery, dateFilter, sortOrder]);

  const navigateToProject = useCallback((projectId) => {
    navigate(`/project/${projectId}`);
  }, [navigate]);

  const handleModalOpen = useCallback((editMode = false, project = null) => {
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
      });
      setProjectManagers([]);
      setProductOwners([]);
      setScrumMasters([]);
      setDevelopers([]);
      setTesters([]);
    }

    setModalOpen(true);
  }, [users]);

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
    });
    setProjectManagers([]);
    setProductOwners([]);
    setScrumMasters([]);
    setDevelopers([]);
    setTesters([]);
  }, []);

  const handleDeleteDialogOpen = useCallback((project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setProjectToDelete(null);
    setDeleteDialogOpen(false);
  }, []);

  const handleDeleteProject = useCallback(() => {
    if (!projectToDelete) return;

    const updatedProjects = projects.filter(
      (project) => project.id !== projectToDelete.id
    );
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
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
  }, [projects, projectToDelete, currentUser, createNotification]);

  const handleNext = useCallback(() => {
    if (activeStep >= steps.length - 1) return;
    
    let errors = [];
    if (activeStep === 0) {
      if (!projectForm.title) errors.push("Le titre du projet est requis");
      if (!projectForm.method) errors.push("La méthode agile est requise");
    } else if (activeStep === 1) {
      if (projectManagers.length === 0) errors.push("Au moins un chef de projet doit être assigné");
    }

    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }
    
    setActiveStep(prev => prev + 1);
    setFormError('');
  }, [activeStep, projectForm, projectManagers, steps.length]);

  const handleBack = useCallback(() => {
    if (activeStep <= 0) return;
    setActiveStep(prev => prev - 1);
    setFormError('');
  }, [activeStep]);

  // Fonction pour envoyer des notifications à tous les utilisateurs d'un projet
  const notifyProjectUsers = useCallback((projectData, isEditing) => {
    const projectTitle = projectData.title;
    const projectId = projectData.id;
    
    // Fonction helper pour envoyer des notifications par rôle
    const notifyUsersByRole = (users, roleName) => {
      users.forEach(userEmail => {
        if (userEmail !== currentUser?.email) {
          createNotification({
            recipient: userEmail,
            type: 'project',
            message: isEditing
              ? `Vous avez été ${roleName === 'développeur' ? 'assigné' : 'assignée'} en tant que ${roleName} au projet "${projectTitle}" récemment mis à jour.`
              : `Vous avez été ${roleName === 'développeur' ? 'assigné' : 'assignée'} en tant que ${roleName} au nouveau projet "${projectTitle}".`,
            sender: { name: currentUser?.nom ? `${currentUser.nom} ${currentUser.prenom}` : 'Système', avatar: null },
            metadata: { projectId }
          });
        }
      });
    };

    // Notifier chaque utilisateur selon son rôle
    notifyUsersByRole(projectData.projectManagers, 'chef de projet');
    notifyUsersByRole(projectData.productOwners, 'product owner');
    notifyUsersByRole(projectData.scrumMasters, 'scrum master');
    notifyUsersByRole(projectData.users, 'développeur');
    notifyUsersByRole(projectData.testers, 'testeur');
    
  }, [createNotification, currentUser]);

  const handleSaveProject = useCallback(() => {
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
      id: isEditing ? projectForm.id : Date.now().toString(),
      title: projectForm.title,
      description: projectForm.description,
      method: projectForm.method,
      projectManagers: projectManagers.map((pm) => pm.email),
      productOwners: productOwners.map((po) => po.email),
      scrumMasters: scrumMasters.map((sm) => sm.email),
      users: developers.map((dev) => dev.email),
      testers: testers.map((tester) => tester.email),
      createdAt: isEditing
        ? projects.find((p) => p.id === projectForm.id)?.createdAt ||
          new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      createdBy: currentUser?.email || '',
    };

    let updatedProjects;
    if (isEditing) {
      updatedProjects = projects.map((project) =>
        project.id === projectForm.id ? { ...project, ...projectData } : project
      );
    } else {
      updatedProjects = [...projects, projectData];
    }

    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);

    // Notifier l'utilisateur courant de la création/modification du projet
    createNotification({
      recipient: currentUser.email,
      type: 'project',
      message: `Projet "${projectData.title}" ${isEditing ? 'mis à jour' : 'créé'} avec succès`,
      metadata: { projectId: projectData.id }
    });
    
    // Notifier tous les utilisateurs assignés au projet
    notifyProjectUsers(projectData, isEditing);

    setFormSuccess(
      isEditing ? 'Projet mis à jour avec succès !' : 'Projet créé avec succès !'
    );

    setTimeout(() => {
      handleModalClose();
    }, 1500);
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
    notifyProjectUsers
  ]);

  const handleMenuOpen = useCallback((event, project) => {
    setSelectedProject(project);
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedProject(null);
  }, []);

  return {
    projects,
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