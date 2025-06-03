import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Tab,
  Tabs,
  Divider,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBacklogs,
  createBacklog,
  updateBacklog,
  deleteBacklog,
  fetchAllTasks,
  createTask,
  updateTask,
  deleteTask,
  clearTasksError,
  fetchKanbanColumns,
  fetchSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  createKanbanColumn,
} from '../store/slices/taskSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/common/PageTitle';
import InputUserAssignment from '../components/common/InputUserAssignment';
import {
  StyledPaper,
  TaskItem,
  BacklogHeader,
  BacklogContainer,
  BacklogContent,
  ScrollableContainer,
  FormDialogContent,
} from '../components/backlog/theme';

// Utility Functions
const isSprintOverdue = (sprint) => {
  if (!sprint?.endDate) return false;
  const endDate = new Date(sprint.endDate);
  const today = new Date();
  return endDate < today;
};

const findNextUpcomingSprint = (sprints, currentDate) => {
  if (!sprints || sprints.length === 0) return null;
  const upcomingSprints = sprints.filter((sprint) => {
    const endDate = new Date(sprint.endDate);
    return endDate >= currentDate;
  });
  if (upcomingSprints.length === 0) return null;
  return upcomingSprints.reduce((closest, sprint) => {
    const startDate = new Date(sprint.startDate);
    if (!closest) return sprint;
    const closestStartDate = new Date(closest.startDate);
    return Math.abs(startDate - currentDate) < Math.abs(closestStartDate - currentDate)
      ? sprint
      : closest;
  }, null);
};

// Priority Mapping for French Display
const priorityMap = {
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

// Main BacklogPage Component
function BacklogPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const users = useSelector((state) => state.users?.users || []);
  const { backlogs, tasks, columns, sprints, status, error: reduxError } = useSelector((state) => state.tasks);

  // State Management
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('backlog');
  const [backlogDialogOpen, setBacklogDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [addToSprintDialogOpen, setAddToSprintDialogOpen] = useState(false);
  const [deleteBacklogDialogOpen, setDeleteBacklogDialogOpen] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [deleteSprintDialogOpen, setDeleteSprintDialogOpen] = useState(false);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [currentBacklog, setCurrentBacklog] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [selectedItemForSprint, setSelectedItemForSprint] = useState(null);
  const [selectedBacklogForSprint, setSelectedBacklogForSprint] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [backlogToDelete, setBacklogToDelete] = useState(null);
  const [sprintToDelete, setSprintToDelete] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    title: '',
    assignedUsers: [],
    priority: 'MEDIUM',
    status: 'À faire',
    subtasks: [],
    sprintId: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backlogPage, setBacklogPage] = useState(1);
  const [sprintPage, setSprintPage] = useState(1);
  const backlogsPerPage = 2;
  const sprintsPerPage = 3;

  // Permission Check
  useEffect(() => {
    if (!currentUser?.claims?.some(claim => [
      'CanViewProjects',
      'CanCreateBacklogs',
      'CanUpdateBacklogs',
      'CanDeleteBacklogs',
      'CanCreateSprints',
      'CanUpdateSprints',
      'CanDeleteSprints'
    ].includes(claim))) {
      navigate('/no-access', { replace: true });
    }
  }, [currentUser, navigate]);

  // Reassign Incomplete Tasks from Overdue Sprints
  useEffect(() => {
    const reassignIncompleteTasks = async () => {
      if (!sprints || !tasks || !projectId) return;
      const currentDate = new Date();
      const completedSprints = sprints.filter((sprint) => isSprintOverdue(sprint));
      const nextSprint = findNextUpcomingSprint(sprints, currentDate);

      if (!nextSprint) {
        console.log('[reassignIncompleteTasks] No upcoming sprint found.');
        return;
      }

      for (const sprint of completedSprints) {
        const incompleteTasks = tasks.filter(
          (task) => task.sprintId === sprint.id && task.status !== 'Terminé'
        );

        for (const task of incompleteTasks) {
          try {
            const taskData = {
              ...task,
              sprintId: nextSprint.id,
              projectId: parseInt(projectId),
              overdueFromSprint: sprint.name, // Tag task with overdue sprint name
            };
            await dispatch(updateTask({ taskId: task.id, taskData, attachments: [] })).unwrap();

            // Update sprint taskIds
            const updatedSprintTasks = [...(nextSprint.taskIds || []), task.id];
            dispatch(updateSprint({
              sprintId: nextSprint.id,
              sprintData: { ...nextSprint, taskIds: updatedSprintTasks },
            }));

            // Remove task from completed sprint
            const updatedCompletedSprintTasks = (sprint.taskIds || []).filter(
              (id) => id !== task.id
            );
            dispatch(updateSprint({
              sprintId: sprint.id,
              sprintData: { ...sprint, taskIds: updatedCompletedSprintTasks },
            }));

            // Notify assigned users
            if (task.assignedUserEmails && Array.isArray(task.assignedUserEmails)) {
              task.assignedUserEmails.forEach((email) => {
                if (email && email !== currentUser?.email) {
                  createNotification({
                    recipient: email,
                    type: 'task',
                    message: `La tâche "${task.title}" a été déplacée du sprint terminé "${sprint.name}" vers le sprint "${nextSprint.name}" dans le projet "${project?.title || 'Projet inconnu'}".`,
                    sender: { name: currentUser?.name || currentUser?.email, avatar: null },
                    metadata: { taskId: task.id },
                  });
                }
              });
            }
          } catch (err) {
            console.error('[reassignIncompleteTasks] Error reassigning task:', {
              taskId: task.id,
              error: err.message,
            });
            setError('Erreur lors du déplacement des tâches incomplètes.');
          }
        }
      }
    };

    reassignIncompleteTasks();
  }, [sprints, tasks, projectId, dispatch, currentUser, project, createNotification]);

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!projectId || isNaN(parseInt(projectId))) {
          throw new Error('ID du projet invalide');
        }

        const projectResponse = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(projectResponse.data);
        setProject(normalizedProject);

        if (!users || users.length === 0) {
          await dispatch(fetchUsers()).unwrap();
        }

        await Promise.all([
          dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap(),
          dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap(),
          dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) })).unwrap(),
          dispatch(fetchSprints({ projectId: parseInt(projectId) })).unwrap(),
        ]);

        const projectUserEmails = [
          ...(normalizedProject.projectManagers || []),
          ...(normalizedProject.productOwners || []),
          ...(normalizedProject.scrumMasters || []),
          ...(normalizedProject.users || []),
          ...(normalizedProject.testers || []),
          ...(normalizedProject.observers || []),
        ].filter((email, index, self) => email && self.indexOf(email) === index);

        const projectUsersData = projectUserEmails
          .map((email) => {
            const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
            return user
              ? { id: user.id, email: user.email, firstName: user.firstName || '', lastName: user.lastName || '', name: user.firstName ? `${user.firstName} ${user.lastName}` : email }
              : { id: null, email, firstName: '', lastName: '', name: email };
          })
          .filter((user) => user.email);

        setProjectUsers(projectUsersData);
      } catch (err) {
        console.error('[loadData] Error:', err);
        setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, dispatch, users]);
 const handleUpdateItem = async () => {
  if (!currentItem || !currentItem.id) {
    setError('Tâche introuvable pour la mise à jour.');
    return;
  }
  
  if (!formValues.title.trim()) {
    setError('Le titre de la tâche est requis.');
    return;
  }
  if (!formValues.status) {
    setError('Le statut de la tâche est requis.');
    return;
  }
  
  setIsSubmitting(true);
  setError('');
  
  try {
    const taskData = {
      title: formValues.title,
      description: formValues.description || '',
      assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
      priority: formValues.priority.toUpperCase(),
      status: formValues.status,
      projectId: parseInt(projectId),
      backlogIds: currentItem.backlogIds || [],
      subtasks: formValues.subtasks.filter((subtask) => subtask.trim()),
      sprintId: formValues.sprintId || null,
      createdIn: currentItem.createdIn || 'backlog',
    };

    // Vérifier si le sprint a changé
    const oldSprintId = currentItem.sprintId;
    const newSprintId = formValues.sprintId;
    const sprintChanged = oldSprintId !== newSprintId;

    // Mettre à jour la tâche
    const result = await dispatch(updateTask({ 
      taskId: currentItem.id, 
      taskData, 
      attachments: [] 
    })).unwrap();

    // Gérer le changement de sprint si nécessaire
    if (sprintChanged) {
      // Retirer la tâche de l'ancien sprint
      if (oldSprintId) {
        const oldSprint = sprints.find(s => s.id === oldSprintId);
        if (oldSprint) {
          const updatedTaskIds = oldSprint.taskIds?.filter(id => id !== currentItem.id) || [];
          await dispatch(updateSprint({
            sprintId: oldSprintId,
            sprintData: { ...oldSprint, taskIds: updatedTaskIds }
          }));
        }
      }

      // Ajouter la tâche au nouveau sprint
      if (newSprintId) {
        const newSprint = sprints.find(s => s.id === newSprintId);
        if (newSprint) {
          const updatedTaskIds = [...(newSprint.taskIds || []), currentItem.id];
          await dispatch(updateSprint({
            sprintId: newSprintId,
            sprintData: { ...newSprint, taskIds: updatedTaskIds }
          }));
        }
      }
    }

    // Notifier les utilisateurs assignés
    const previousAssignedEmails = currentItem.assignedUserEmails || [];
    const newAssignedEmails = taskData.assignedUserEmails;
    const newlyAssignedEmails = newAssignedEmails.filter(email => !previousAssignedEmails.includes(email));

    for (const email of newlyAssignedEmails) {
      const user = projectUsers.find(u => u.email === email);
      if (user && user.email !== currentUser.email && user.id) {
        await createNotification({
          recipientUserId: user.id, // Changé de userId à recipientUserId
          type: 'task',
          message: `Vous avez été assigné à la tâche mise à jour "${formValues.title}" dans le projet "${project?.title || 'Projet inconnu'}".`,
          relatedEntityType: 'Task',
          relatedEntityId: currentItem.id,
        });
      }
    }

    // Notifier du changement de sprint si nécessaire
    if (sprintChanged && taskData.assignedUserEmails?.length > 0) {
      const sprintName = sprints.find(s => s.id === newSprintId)?.name || 'nouveau sprint';
      const oldSprintName = sprints.find(s => s.id === oldSprintId)?.name || 'ancien sprint';
      
      for (const email of taskData.assignedUserEmails) {
        const user = projectUsers.find(u => u.email === email);
        if (user && user.id && email !== currentUser?.email) {
          createNotification({
            recipientUserId: user.id, // Changé de recipient à recipientUserId
            type: 'task',
            message: `La tâche "${formValues.title}" a été déplacée ${oldSprintId ? `du sprint "${oldSprintName}" ` : ''}vers le sprint "${sprintName}" dans le projet "${project?.title || 'Projet inconnu'}".`,
            sender: { name: currentUser?.name || currentUser?.email, avatar: null },
            metadata: { taskId: currentItem.id },
          });
        }
      }
    }

    window.dispatchEvent(new Event('newNotification'));
    handleCloseItemDialog();
  } catch (err) {
    console.error('[handleUpdateItem] Error:', err);
    setError(err.response?.data?.message || 'Erreur lors de la mise à jour de la tâche');
  } finally {
    setIsSubmitting(false);
  }
};
  // Handlers for Dialogs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenBacklogDialog = (backlog = null) => {
    setCurrentBacklog(backlog);
    setFormValues({
      name: backlog?.name || '',
      description: backlog?.description || '',
      title: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      status: 'À faire',
      subtasks: [],
      sprintId: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setBacklogDialogOpen(true);
  };

  const handleCloseBacklogDialog = () => {
    setBacklogDialogOpen(false);
    setCurrentBacklog(null);
    setFormValues({
      name: '',
      description: '',
      title: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      status: 'À faire',
      subtasks: [],
      sprintId: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setError('');
  };

  const handleOpenItemDialog = (backlogId, item = null) => {
    const backlog = backlogs.find((b) => b.id === backlogId);
    setCurrentBacklog(backlog);
    setCurrentItem(item);
    setFormValues({
      name: '',
      description: item?.description || '',
      title: item?.title || '',
      assignedUsers: item ? projectUsers.filter((u) => item.assignedUserEmails?.includes(u.email)) : [],
      priority: item?.priority || 'MEDIUM',
      status: item?.status || 'À faire',
      subtasks: item?.subtasks || [],
      sprintId: item?.sprintId || null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setCurrentItem(null);
    setFormValues({
      name: '',
      description: '',
      title: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      status: 'À faire',
      subtasks: [],
      sprintId: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setError('');
  };

  const handleOpenSprintDialog = (sprint = null) => {
    setCurrentSprint(sprint);
    setFormValues({
      name: sprint?.name || '',
      description: sprint?.description || '',
      startDate: sprint?.startDate || new Date().toISOString().split('T')[0],
      endDate: sprint?.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      status: 'À faire',
      subtasks: [],
      sprintId: null,
    });
    setSprintDialogOpen(true);
  };

  const handleCloseSprintDialog = () => {
    setSprintDialogOpen(false);
    setCurrentSprint(null);
    setFormValues({
      name: '',
      description: '',
      title: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      status: 'À faire',
      subtasks: [],
      sprintId: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setError('');
  };

  const handleOpenAddToSprintDialog = (backlogId, itemId) => {
    setSelectedBacklogForSprint(backlogId);
    setSelectedItemForSprint(itemId);
    setAddToSprintDialogOpen(true);
  };

  const handleCloseAddToSprintDialog = () => {
    setAddToSprintDialogOpen(false);
    setSelectedBacklogForSprint(null);
    setSelectedItemForSprint(null);
  };

  const handleOpenDeleteBacklogDialog = (backlogId) => {
    setBacklogToDelete(backlogId);
    setDeleteBacklogDialogOpen(true);
  };

  const handleCloseDeleteBacklogDialog = () => {
    setDeleteBacklogDialogOpen(false);
    setBacklogToDelete(null);
  };

  const handleOpenDeleteItemDialog = (taskId) => {
    setItemToDelete(taskId);
    setDeleteItemDialogOpen(true);
  };

  const handleCloseDeleteItemDialog = () => {
    setDeleteItemDialogOpen(false);
    setItemToDelete(null);
  };

  const handleOpenDeleteSprintDialog = (sprintId) => {
    setSprintToDelete(sprintId);
    setDeleteSprintDialogOpen(true);
  };

  const handleCloseDeleteSprintDialog = () => {
    setDeleteSprintDialogOpen(false);
    setSprintToDelete(null);
  };

  const handleOpenTaskDetailsDialog = (task) => {
    setSelectedTask(task);
    setTaskDetailsDialogOpen(true);
  };

  const handleCloseTaskDetailsDialog = () => {
    setTaskDetailsDialogOpen(false);
    setSelectedTask(null);
  };

  // Handlers for Backend Operations
  const handleAddBacklog = async () => {
    if (!formValues.name.trim()) {
      setError('Le nom du backlog est requis.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const backlogData = {
        name: formValues.name,
        description: formValues.description,
        projectId: parseInt(projectId),
      };
      await dispatch(createBacklog({ backlogData })).unwrap();
      handleCloseBacklogDialog();
    } catch (err) {
      console.error('[handleAddBacklog] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du backlog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBacklog = async () => {
    if (!formValues.name.trim()) {
      setError('Le nom du backlog est requis.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const backlogData = {
        name: formValues.name,
        description: formValues.description,
      };
      await dispatch(updateBacklog({ backlogId: currentBacklog.id, backlogData })).unwrap();
      await dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap();
      handleCloseBacklogDialog();
    } catch (err) {
      console.error('[handleUpdateBacklog] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du backlog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBacklog = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteBacklog({ backlogId: backlogToDelete })).unwrap();
      handleCloseDeleteBacklogDialog();
      const totalPages = Math.ceil((backlogs.length - 1) / backlogsPerPage);
      if (backlogPage > totalPages && totalPages > 0) {
        setBacklogPage(totalPages);
      } else if (totalPages === 0) {
        setBacklogPage(1);
      }
    } catch (err) {
      console.error('[handleDeleteBacklog] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du backlog');
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleAddItem = async () => {
  if (!formValues.title.trim()) {
    setError('Le titre de la tâche est requis.');
    return;
  }
  if (!formValues.status) {
    setError('Le statut de la tâche est requis.');
    return;
  }
  setIsSubmitting(true);
  setError('');
  try {
    const taskData = {
      title: formValues.title,
      description: formValues.description || '',
      assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
      priority: formValues.priority.toUpperCase(),
      status: formValues.status,
      projectId: parseInt(projectId),
      backlogIds: [parseInt(currentBacklog.id)],
      subtasks: formValues.subtasks.filter((subtask) => subtask.trim()),
      sprintId: formValues.sprintId || null,
      createdIn: 'backlog',
    };
    const result = await dispatch(createTask({ taskData, attachments: [] })).unwrap();

    // Refetch backlogs to ensure taskIds are updated
    await dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap();

    for (const user of formValues.assignedUsers) {
      if (user.email && user.email !== currentUser.email && user.id) {
        await createNotification({
          userId: user.id,
          type: 'task',
          message: `Vous avez été assigné à la tâche "${formValues.title}" dans le projet "${project?.title || 'Projet inconnu'}".`,
          relatedEntityType: 'Task',
          relatedEntityId: result.id,
        });
      }
    }

    window.dispatchEvent(new Event('newNotification'));
    handleCloseItemDialog();
  } catch (err) {
    console.error('[handleAddItem] Error:', err);
    setError(err.response?.data?.message || 'Erreur lors de la création de la tâche');
  } finally {
    setIsSubmitting(false);
  }
};
  const handleDeleteItem = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteTask(itemToDelete)).unwrap();
      handleCloseDeleteItemDialog();
    } catch (err) {
      console.error('[handleDeleteItem] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!formValues.name.trim()) {
      setError('Le nom du sprint est requis.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const sprintData = {
        name: formValues.name,
        description: formValues.description,
        projectId: parseInt(projectId),
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      };
      await dispatch(createSprint({ sprintData })).unwrap();
      handleCloseSprintDialog();
    } catch (err) {
      console.error('[handleCreateSprint] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSprint = async () => {
    if (!formValues.name.trim()) {
      setError('Le nom du sprint est requis.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const sprintData = {
        name: formValues.name,
        description: formValues.description,
        projectId: parseInt(projectId),
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      };
      await dispatch(updateSprint({ sprintId: currentSprint.id, sprintData })).unwrap();
      handleCloseSprintDialog();
    } catch (err) {
      console.error('[handleUpdateSprint] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSprint = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteSprint({ sprintId: sprintToDelete })).unwrap();
      handleCloseDeleteSprintDialog();
      const totalPages = Math.ceil((sprints.length - 1) / sprintsPerPage);
      if (sprintPage > totalPages && totalPages > 0) {
        setSprintPage(totalPages);
      } else if (totalPages === 0) {
        setSprintPage(1);
      }
    } catch (err) {
      console.error('[handleDeleteSprint] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToSprint = async (sprintId) => {
    setIsSubmitting(true);
    setError('');
    try {
      const task = tasks.find((t) => t.id === selectedItemForSprint);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      const taskData = {
        ...task,
        sprintId,
        backlogIds: task.backlogIds || [],
        projectId: parseInt(projectId),
      };
      await dispatch(updateTask({ taskId: task.id, taskData, attachments: [] })).unwrap();

      const sprint = sprints.find((s) => s.id === sprintId);
      if (sprint) {
        const newTaskIds = [...(sprint.taskIds || []), task.id];
        dispatch(updateSprint({
          sprintId,
          sprintData: { ...sprint, taskIds: newTaskIds },
        }));
      }

      if (task.assignedUserEmails && Array.isArray(task.assignedUserEmails)) {
        task.assignedUserEmails.forEach((email) => {
          if (email && email !== currentUser?.email) {
            createNotification({
              recipient: email,
              type: 'task',
              message: `La tâche "${task.title}" a été ajoutée au sprint "${sprint?.name || 'Sprint inconnu'}" dans le projet "${project?.title || 'Projet inconnu'}".`,
              sender: { name: currentUser?.name || currentUser?.email, avatar: null },
              metadata: { taskId: task.id },
            });
          }
        });
      }

      handleCloseAddToSprintDialog();
    } catch (err) {
      console.error('[handleAddToSprint] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de l’ajout au sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleUpdateSprintItemStatus = async (taskId, newStatus) => {
  setIsSubmitting(true);
  setError('');
  
  try {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error('Tâche non trouvée');
    }

    // Vérifier si nous devons créer la colonne "Terminé"
    if (newStatus === 'Terminé') {
      const doneColumn = columns.find((col) => col.name.toLowerCase() === 'terminé');
      if (!doneColumn) {
        await dispatch(createKanbanColumn({
          columnData: {
            name: 'Terminé',
            projectId: parseInt(projectId),
            displayOrder: columns.length + 1,
          },
        })).unwrap();
      }
    }

    // Mettre à jour la tâche
    const taskData = {
      ...task,
      status: newStatus,
    };
    
    await dispatch(updateTask({ 
      taskId, 
      taskData, 
      attachments: [] 
    })).unwrap();

    // Notifier les utilisateurs assignés
    if (task.assignedUserEmails && Array.isArray(task.assignedUserEmails)) {
      for (const email of task.assignedUserEmails) {
        if (email && email !== currentUser?.email) {
          createNotification({
            recipient: email,
            type: 'task',
            message: `Le statut de la tâche "${task.title}" a été mis à jour à "${newStatus}" dans le projet "${project?.title || 'Projet inconnu'}".`,
            sender: { name: currentUser?.name || currentUser?.email, avatar: null },
            metadata: { taskId: task.id },
          });
        }
      }
    }
  } catch (err) {
    console.error('[handleUpdateSprintItemStatus] Error:', err);
    setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
  } finally {
    setIsSubmitting(false);
  }
};
  // Pagination Handlers
  const handleBacklogPageChange = (event, value) => {
    setBacklogPage(value);
  };

  const handleSprintPageChange = (event, value) => {
    setSprintPage(value);
  };

  // Form Handlers
  const handleFormChange = (field) => (event, value) => {
    if (field === 'assignedUsers') {
      setFormValues((prev) => ({ ...prev, [field]: value || [] }));
    } else if (field === 'subtasks') {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  const handleAddSubtask = () => {
    setFormValues((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, ''],
    }));
  };

  const handleSubtaskChange = (index) => (event) => {
    const newSubtasks = [...formValues.subtasks];
    newSubtasks[index] = event.target.value;
    setFormValues((prev) => ({ ...prev, subtasks: newSubtasks }));
  };

  const handleRemoveSubtask = (index) => {
    setFormValues((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  // Render Task Item
  const renderBacklogItem = (backlogId, task, isSprint = false) => {
    const sprint = isSprint ? sprints.find(s => s.id === task.sprintId) : null;
    const isOverdue = sprint ? isSprintOverdue(sprint) : false;
    const isTaskDone = task.status === 'Terminé';

    return (
      <TaskItem
        sx={{
          ...(isSprint && isOverdue && !isTaskDone && {
            textDecoration: 'line-through',
            opacity: 0.7,
            backgroundColor: '#f9f9f9'
          })
        }}
      >
        {isSprint && (
          <Checkbox
            checked={isTaskDone}
            onChange={() =>
              handleUpdateSprintItemStatus(
                task.id,
                isTaskDone ? 'OPEN' : 'Terminé'
              )
            }
            disabled={isOverdue}
            sx={{ mt: 1 }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                mr: 1,
                flex: '1 1 auto',
                ...(isSprint && isOverdue && !isTaskDone && { textDecoration: 'line-through' })
              }}
            >
              {task.title}
            </Typography>
            {isSprint && isOverdue && !isTaskDone && (
              <Chip
                label="Sprint terminé"
                size="small"
                color="error"
              />
            )}
            {isSprint && task.overdueFromSprint && !isTaskDone && (
              <Chip
                label={`En retard du sprint ${task.overdueFromSprint}`}
                size="small"
                color="warning"
              />
            )}
          </Box>
          {task.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, wordBreak: 'break-word' }}
            >
              {task.description}
            </Typography>
          )}
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
              label={priorityMap[task.priority] || task.priority}
              size="small"
              color={
                task.priority === 'HIGH' ? 'error' :
                task.priority === 'MEDIUM' ? 'warning' :
                task.priority === 'LOW' ? 'success' : 'default'
              }
            />
            <Chip
              label={task.status}
              size="small"
              color={
                task.status === 'Terminé' ? 'success' :
                task.status === 'En À faire' ? 'info' : 'default'
              }
            />
            {task.assignedUserEmails?.length > 0 && (
              <AvatarGroup max={4} sx={{ flexShrink: 0 }}>
                {task.assignedUserEmails.map((email) => (
                  <Tooltip key={email} title={email}>
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(email),
                        width: 24,
                        height: 24,
                        fontSize: 12,
                      }}
                    >
                      {generateInitials(email)}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            )}
          </Box>
          {task.subtasks?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">Sous-tâches :</Typography>
              <List dense sx={{ py: 0 }}>
                {task.subtasks.map((subtask, index) => (
                  <ListItem key={index} sx={{ py: 0, pl: 1 }}>
                    <ListItemText
                      primary={`- ${subtask}`}
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ml: 'auto', pl: 1, flexShrink: 0 }}>
          <Tooltip title="Voir les détails de la tâche">
            <IconButton
              size="small"
              onClick={() => handleOpenTaskDetailsDialog(task)}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        
          {!isSprint && currentUser?.claims?.includes('CanCreateSprints') && (
            <Tooltip title="Ajouter au sprint">
              <IconButton
                size="small"
                onClick={() => handleOpenAddToSprintDialog(backlogId, task.id)}
              >
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {currentUser?.claims?.includes('CanUpdateTasks') && (
            <Tooltip title="Modifier la tâche">
              <IconButton
                size="small"
                onClick={() => handleOpenItemDialog(backlogId, task)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {currentUser?.claims?.includes('CanDeleteTasks') && (
            <Tooltip title="Supprimer la tâche">
              <IconButton
                size="small"
                onClick={() => handleOpenDeleteItemDialog(task.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TaskItem>
    );
  };

  // Render Backlog Tab
  // Render Backlog Tab
const renderBacklogTab = () => {
  const startIndex = (backlogPage - 1) * backlogsPerPage;
  const endIndex = startIndex + backlogsPerPage;
  const paginatedBacklogs = backlogs.slice(startIndex, endIndex);
  const totalBacklogPages = Math.ceil(backlogs.length / backlogsPerPage);

  // Filter tasks for the authenticated user
  const userTasks = tasks.filter(
    (task) =>
      task.createdByUserId === currentUser?.id ||
      task.assignedUserIds?.includes(currentUser?.id)
  );

  return (
    <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>Backlogs pour le projet {project.title}</PageTitle>
        {currentUser?.claims?.includes('CanCreateBacklogs') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenBacklogDialog()}
          >
            Nouveau Backlog
          </Button>
        )}
      </Box>
      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={40} />
        </Box>
      )}
      {(error || reduxError) && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearTasksError());
                setError('');
                dispatch(fetchBacklogs({ projectId: parseInt(projectId) }));
                dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
                dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) }));
                dispatch(fetchSprints({ projectId: parseInt(projectId) }));
              }}
            >
              Réessayer
            </Button>
          }
        >
          {error || reduxError}
        </Alert>
      )}
      {paginatedBacklogs.length === 0 && status !== 'loading' && !error && !reduxError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            borderRadius: 2,
            py: 8,
            px: 4,
          }}
        >
          <ListAltIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
            Aucun backlog dans ce projet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', maxWidth: 400 }}>
            Commencez à organiser votre projet en créant votre premier backlog.
          </Typography>
          {currentUser?.claims?.includes('CanCreateBacklogs') && (
            <IconButton
              onClick={() => handleOpenBacklogDialog()}
              sx={{
                mb: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 60,
                height: 60,
              }}
              title="Créer un nouveau backlog"
            >
              <AddIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
        </Box>
      ) : (
        <>
          {paginatedBacklogs.map((backlog) => {
            // Filter tasks for this backlog that belong to the user
            const backlogUserTasks = userTasks.filter((task) =>
              backlog.taskIds.includes(task.id)
            );

            return (
              <BacklogContainer key={backlog.id}>
                <BacklogHeader>
                  <Box>
                    <Typography variant="h6">{backlog.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {backlog.description}
                    </Typography>
                  </Box>
                  <Box>
                    {currentUser?.claims?.includes('CanUpdateBacklogs') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenBacklogDialog(backlog)}
                        title="Modifier le backlog"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanDeleteBacklogs') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteBacklogDialog(backlog.id)}
                        title="Supprimer le backlog"
                        disabled={isSubmitting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanCreateTasks') && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenItemDialog(backlog.id)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        Ajouter Item
                      </Button>
                    )}
                  </Box>
                </BacklogHeader>
                <BacklogContent>
                  {backlogUserTasks.length > 0 ? (
                    backlogUserTasks.map((task) => (
                      <Box key={task.id}>
                        {renderBacklogItem(backlog.id, task)}
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Aucune tâche créée ou assignée à vous dans ce backlog.
                      {currentUser?.claims?.includes('CanCreateTasks') ? ' Cliquez sur "Ajouter Item" pour commencer.' : ''}
                    </Typography>
                  )}
                </BacklogContent>
              </BacklogContainer>
            );
          })}
          {totalBacklogPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalBacklogPages}
                page={backlogPage}
                onChange={handleBacklogPageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </ScrollableContainer>
  );
};

  // Render Sprints Tab
 // Render Sprints Tab
const renderSprintsTab = () => {
  const startIndex = (sprintPage - 1) * sprintsPerPage;
  const endIndex = startIndex + sprintsPerPage;
  const paginatedSprints = sprints.slice(startIndex, endIndex);
  const totalSprintPages = Math.ceil(sprints.length / sprintsPerPage);

  // Filter tasks for the authenticated user
  const userTasks = tasks.filter(
    (task) =>
      task.createdByUserId === currentUser?.id ||
      task.assignedUserIds?.includes(currentUser?.id)
  );

  return (
    <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>Tableau Kanban pour le projet {project.title}</PageTitle>
        {currentUser?.claims?.includes('CanCreateSprints') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSprintDialog()}
          >
            Nouveau Sprint
          </Button>
        )}
      </Box>
      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={40} />
        </Box>
      )}
      {(error || reduxError) && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearTasksError());
                setError('');
                dispatch(fetchSprints({ projectId: parseInt(projectId) }));
              }}
            >
              Réessayer
            </Button>
          }
        >
          {error || reduxError}
        </Alert>
      )}
      {paginatedSprints.length === 0 && status !== 'loading' && !error && !reduxError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            borderRadius: 2,
            py: 8,
            px: 4,
          }}
        >
          <TimelineIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
            Aucun sprint dans ce projet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', maxWidth: 400 }}>
            Lancez votre projet en créant votre premier sprint.
          </Typography>
          {currentUser?.claims?.includes('CanCreateSprints') && (
            <IconButton
              onClick={() => handleOpenSprintDialog()}
              sx={{
                mb: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 60,
                height: 60,
              }}
              title="Créer un nouveau sprint"
            >
              <AddIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
        </Box>
      ) : (
        <>
          {paginatedSprints.map((sprint) => {
            // Filter tasks for this sprint that belong to the user
            const sprintUserTasks = userTasks.filter((task) => task.sprintId === sprint.id);
            const isOverdue = isSprintOverdue(sprint);

            return (
              <StyledPaper key={sprint.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{sprint.name}</Typography>
                      {isOverdue && (
                        <Chip
                          label="Sprint terminé"
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {sprint.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sprint.startDate} à {sprint.endDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 2 }}>
                      {sprintUserTasks.length} tâches • {sprintUserTasks.filter((t) => t.status === 'Terminé').length} terminées
                    </Typography>
                    {currentUser?.claims?.includes('CanUpdateSprints') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSprintDialog(sprint)}
                        title="Modifier le sprint"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanDeleteSprints') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteSprintDialog(sprint.id)}
                        title="Supprimer le sprint"
                        disabled={isSubmitting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {sprintUserTasks.length > 0 ? (
                  sprintUserTasks.map((task) => (
                    <Box key={task.id}>
                      {renderBacklogItem(null, task, true)}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucune tâche créée ou assignée à vous dans ce sprint.
                  </Typography>
                )}
              </StyledPaper>
            );
          })}
          {totalSprintPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalSprintPages}
                page={sprintPage}
                onChange={handleSprintPageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </ScrollableContainer>
  );
};

  // Render Dialogs
  const renderBacklogDialog = () => (
    <Dialog
      open={backlogDialogOpen}
      onClose={handleCloseBacklogDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentBacklog ? 'Modifier le backlog' : 'Créer un nouveau backlog'}
        <IconButton
          onClick={handleCloseBacklogDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Nom du backlog"
          fullWidth
          variant="outlined"
          value={formValues.name}
          onChange={handleFormChange('name')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
          error={!formValues.name.trim()}
          helperText={!formValues.name.trim() ? 'Le nom est requis' : ''}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formValues.description}
          onChange={handleFormChange('description')}
          disabled={isSubmitting}
        />
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseBacklogDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentBacklog ? handleUpdateBacklog : handleAddBacklog}
          disabled={isSubmitting || !formValues.name.trim()}
        >
          {isSubmitting ? 'Traitement...' : currentBacklog ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderItemDialog = () => (
    <Dialog
      open={itemDialogOpen}
      onClose={handleCloseItemDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentItem ? 'Modifier l\'item' : 'Ajouter un nouvel item'}
        <IconButton
          onClick={handleCloseItemDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Titre"
          fullWidth
          variant="outlined"
          value={formValues.title}
          onChange={handleFormChange('title')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
          error={!formValues.title.trim()}
          helperText={!formValues.title.trim() ? 'Le titre est requis' : ''}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formValues.description}
          onChange={handleFormChange('description')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <InputUserAssignment
          options={projectUsers}
          value={formValues.assignedUsers}
          onChange={(event, newValue) => handleFormChange('assignedUsers')(event, newValue)}
          label="Membres assignés"
          placeholder="Sélectionner des membres"
          getAvatarColor={getAvatarColor}
          generateInitials={generateInitials}
          disabled={isSubmitting}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="priority-label">Priorité</InputLabel>
          <Select
            labelId="priority-label"
            value={formValues.priority}
            onChange={handleFormChange('priority')}
            label="Priorité"
            disabled={isSubmitting}
          >
            <MenuItem value="HIGH">Haute</MenuItem>
            <MenuItem value="MEDIUM">Moyenne</MenuItem>
            <MenuItem value="LOW">Basse</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }} error={!formValues.status}>
          <InputLabel id="status-label">Statut</InputLabel>
          <Select
            labelId="status-label"
            value={formValues.status}
            onChange={handleFormChange('status')}
            label="Statut"
            disabled={isSubmitting}
            required
          >
            <MenuItem value="À faire">À faire</MenuItem>
            {currentItem && formValues.status !== 'À faire' && (
              <>
             
                <MenuItem value="Terminé">Terminé</MenuItem>
              </>
            )}
          </Select>
          {!formValues.status && (
            <Typography variant="caption" color="error">
              Le statut est requis
            </Typography>
          )}
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="sprint-label">Sprint</InputLabel>
          <Select
            labelId="sprint-label"
            value={formValues.sprintId || ''}
            onChange={handleFormChange('sprintId')}
            label="Sprint"
            disabled={isSubmitting}
          >
            <MenuItem value="">Aucun</MenuItem>
            {sprints.map((sprint) => (
              <MenuItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Sous-tâches
          </Typography>
          {formValues.subtasks.map((subtask, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={subtask}
                onChange={handleSubtaskChange(index)}
                placeholder={`Sous-tâche ${index + 1}`}
                disabled={isSubmitting}
              />
              <IconButton
                onClick={() => handleRemoveSubtask(index)}
                disabled={isSubmitting}
                title="Supprimer la sous-tâche"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSubtask}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          >
            Ajouter une sous-tâche
          </Button>
        </Box>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseItemDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentItem ? handleUpdateItem : handleAddItem}
          disabled={isSubmitting || !formValues.title.trim() || !formValues.status}
        >
          {isSubmitting ? 'Traitement...' : currentItem ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderSprintDialog = () => (
    <Dialog
      open={sprintDialogOpen}
      onClose={handleCloseSprintDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentSprint ? 'Modifier le sprint' : 'Créer un nouveau sprint'}
        <IconButton
          onClick={handleCloseSprintDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Nom du sprint"
          fullWidth
          variant="outlined"
          value={formValues.name}
          onChange={handleFormChange('name')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
          error={!formValues.name.trim()}
          helperText={!formValues.name.trim() ? 'Le nom est requis' : ''}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formValues.description}
          onChange={handleFormChange('description')}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Date de début"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formValues.startDate}
            onChange={handleFormChange('startDate')}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
          <TextField
            label="Date de fin"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formValues.endDate}
            onChange={handleFormChange('endDate')}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
        </Box>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseSprintDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={currentSprint ? handleUpdateSprint : handleCreateSprint}
          disabled={isSubmitting || !formValues.name.trim()}
        >
          {isSubmitting ? 'Traitement...' : currentSprint ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderAddToSprintDialog = () => (
    <Dialog
      open={addToSprintDialogOpen}
      onClose={handleCloseAddToSprintDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Ajouter au sprint
        <IconButton
          onClick={handleCloseAddToSprintDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Sélectionnez le sprint auquel vous souhaitez ajouter cet item :
        </Typography>
        <List>
          {sprints.map((sprint) => (
            <ListItem
              key={sprint.id}
              button
              onClick={() => handleAddToSprint(sprint.id)}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
              disabled={isSubmitting}
            >
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText
                primary={sprint.name}
                secondary={`${sprint.startDate} à ${sprint.endDate}`}
              />
            </ListItem>
          ))}
        </List>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseAddToSprintDialog} disabled={isSubmitting}>
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );

 const renderTaskDetailsDialog = () => (
  <Dialog
    open={taskDetailsDialogOpen}
    onClose={handleCloseTaskDetailsDialog}
    maxWidth="sm"
    fullWidth
    disableBackdropClick
  >
    <DialogTitle sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: 'primary.main',
      color: 'white',
      py: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ListAltIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Détails de la tâche</Typography>
      </Box>
      <IconButton
        onClick={handleCloseTaskDetailsDialog}
        sx={{ color: 'white' }}
        title="Fermer"
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <FormDialogContent>
      {selectedTask && (
        <>
          {/* Section Principale */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            mt: 2 
          }}>
            {/* Titre et Description */}
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold',
                mb: 1,
                color: 'text.primary'
              }}>
                {selectedTask.title}
              </Typography>
              {selectedTask.description && (
                <Paper elevation={0} sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Typography variant="body1">
                    {selectedTask.description}
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Métadonnées */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: 2 
            }}>
              {/* Priorité */}
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Priorité
                </Typography>
                <Chip
                  label={priorityMap[selectedTask.priority] || selectedTask.priority}
                  size="medium"
                  color={
                    selectedTask.priority === 'HIGH' ? 'error' :
                    selectedTask.priority === 'MEDIUM' ? 'warning' :
                    selectedTask.priority === 'LOW' ? 'success' : 'default'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              </Paper>

              {/* Statut */}
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Statut
                </Typography>
                <Chip
                  label={selectedTask.status}
                  size="medium"
                  color={
                    selectedTask.status === 'Terminé' ? 'success' :
                    selectedTask.status === 'En cours' ? 'info' : 'default'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              </Paper>

              {/* Dates */}
              {selectedTask.createdAt && (
                <Paper elevation={0} sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Créée le
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedTask.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Sprint Information */}
            {selectedTask.sprintId && (
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sprint
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon color="primary" />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {sprints.find(s => s.id === selectedTask.sprintId)?.name || 'Inconnu'}
                  </Typography>
                </Box>
                {sprints.find(s => s.id === selectedTask.sprintId)?.description && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {sprints.find(s => s.id === selectedTask.sprintId)?.description}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Overdue Information */}
            {selectedTask.overdueFromSprint && selectedTask.status !== 'Terminé' && (
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'warning.light',
                borderRadius: 1,
                borderLeft: '4px solid',
                borderColor: 'warning.main'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="warning" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Tâche en retard
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Cette tâche n'a pas été terminée à temps et a été déplacée depuis le sprint "{selectedTask.overdueFromSprint}".
                </Typography>
              </Paper>
            )}

            {/* Assignés */}
            {selectedTask.assignedUserEmails?.length > 0 && (
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Membres assignés ({selectedTask.assignedUserEmails.length})
                </Typography>
                <List dense>
                  {selectedTask.assignedUserEmails.map((email) => {
                    const user = projectUsers.find(u => u.email === email);
                    return (
                      <ListItem key={email} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(email),
                              width: 32,
                              height: 32,
                              fontSize: 14,
                            }}
                          >
                            {generateInitials(email)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={user?.name || email}
                          secondary={email}
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            )}

            {/* Sous-tâches */}
            {selectedTask.subtasks?.length > 0 && (
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Sous-tâches ({selectedTask.subtasks.length})
                </Typography>
                <List dense>
                  {selectedTask.subtasks.map((subtask, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          disabled
                          checked={false}
                          tabIndex={-1}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subtask}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </>
      )}
    </FormDialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button 
        onClick={handleCloseTaskDetailsDialog}
        variant="outlined"
        sx={{ mr: 1 }}
      >
        Fermer
      </Button>
      {currentUser?.claims?.includes('CanUpdateTasks') && (
        <Button
          variant="contained"
          onClick={() => {
            handleCloseTaskDetailsDialog();
            const backlogId = selectedTask.backlogIds?.[0];
            if (backlogId) {
              handleOpenItemDialog(backlogId, selectedTask);
            }
          }}
        >
          Modifier la tâche
        </Button>
      )}
    </DialogActions>
  </Dialog>
);
  const renderDeleteBacklogDialog = () => (
    <Dialog
      open={deleteBacklogDialogOpen}
      onClose={handleCloseDeleteBacklogDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Confirmer la suppression du backlog
        <IconButton
          onClick={handleCloseDeleteBacklogDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        <Typography variant="body1">
          Êtes-vous sûr de vouloir supprimer ce backlog ? Cette action est irréversible et supprimera également tous les items associés.
        </Typography>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseDeleteBacklogDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteBacklog}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteItemDialog = () => (
    <Dialog
      open={deleteItemDialogOpen}
      onClose={handleCloseDeleteItemDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Confirmer la suppression de l'item
        <IconButton
          onClick={handleCloseDeleteItemDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        <Typography variant="body1">
          Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.
        </Typography>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseDeleteItemDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteItem}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteSprintDialog = () => (
    <Dialog
      open={deleteSprintDialogOpen}
      onClose={handleCloseDeleteSprintDialog}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Confirmer la suppression du sprint
        <IconButton
          onClick={handleCloseDeleteSprintDialog}
          disabled={isSubmitting}
          title="Fermer"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <FormDialogContent>
        <Typography variant="body1">
          Êtes-vous sûr de vouloir supprimer ce sprint ? Cette action est irréversible et retirera les tâches associées de ce sprint.
        </Typography>
      </FormDialogContent>
      <DialogActions>
        <Button onClick={handleCloseDeleteSprintDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteSprint}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Loading State
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error State
  if (!project) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearTasksError());
                setError('');
                dispatch(fetchBacklogs({ projectId: parseInt(projectId) }));
                dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
                dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) }));
                dispatch(fetchSprints({ projectId: parseInt(projectId) }));
              }}
            >
              Réessayer
            </Button>
          }
        >
          {error || 'Projet introuvable.'}
        </Alert>
      </Box>
    );
  }

  // Main Render
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: '1px solid #e0e0e0',
          '& .MuiTab-root': { textTransform: 'none', minWidth: 120 },
        }}
      >
        <Tab label="Backlog" icon={<ListAltIcon />} iconPosition="start" value="backlog" />
        <Tab label="Sprints" icon={<TimelineIcon />} iconPosition="start" value="sprints" />
      </Tabs>
      {activeTab === 'backlog' && renderBacklogTab()}
      {activeTab === 'sprints' && renderSprintsTab()}
      {renderBacklogDialog()}
      {renderItemDialog()}
      {renderSprintDialog()}
      {renderAddToSprintDialog()}
      {renderDeleteBacklogDialog()}
      {renderDeleteItemDialog()}
      {renderDeleteSprintDialog()}
      {renderTaskDetailsDialog()}
    </Box>
  );
}

export default BacklogPage;