import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTasks, clearTasksError, createTask, updateTask, deleteTask } from '../store/slices/taskSlice';
import { fetchKanbanColumns, createKanbanColumn } from '../store/slices/kanbanColumnSlice';
import { fetchBacklogs, createBacklog, updateBacklog, deleteBacklog } from '../store/slices/backlogSlice';
import { fetchSprints, createSprint, updateSprint, deleteSprint } from '../store/slices/sprintSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';

import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { calculateTaskCost } from '../utils/estimatedcost-tasks';
import { isSprintOverdue, findNextUpcomingSprint } from '../utils/backlogUtils';

export const useBacklog = (defaultTab = 'backlog') => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();
  const { currentUser } = useAuth();

  // State Management
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTab);
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
    startDate: '',
    endDate: '',
    totalCost: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backlogPage, setBacklogPage] = useState(1);
  const [sprintPage, setSprintPage] = useState(1);
  const [sprintReviewPage, setSprintReviewPage] = useState(1);
  const backlogsPerPage = 2;
  const sprintsPerPage = 3;

  // Redux Selectors
  const users = useSelector((state) => state.users?.users || []);
  const { tasks, status: taskStatus, error: taskError } = useSelector((state) => state.tasks);
  const { columns, status: columnStatus, error: columnError } = useSelector((state) => state.kanbanColumns);
  const { backlogs, sprints } = useSelector((state) => ({
    backlogs: state.backlogs.backlogs,
    sprints: state.sprints.sprints,
  }));

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

  // Data Fetching
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
          dispatch(fetchSprints({ projectId: parseInt(projectId)})).unwrap(),
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
              ? {
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  name: user.firstName ? `${user.firstName} ${user.lastName}` : email,
                  costPerHour: user.costPerHour ?? null,
                  costPerDay: user.costPerDay ?? null,
                }
              : {
                  id: null,
                  email,
                  firstName: '',
                  lastName: '',
                  name: email,
                  costPerHour: null,
                  costPerDay: null,
                };
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

  // Notify users assigned to a task
  const notifyTaskUsers = async (taskData, isEditing) => {
    // Wait for users to be fetched if still loading
    if (projectUsers.length === 0) {
      console.log('Waiting for project users to load before sending notifications...');
      await new Promise((resolve) => {
        const checkUsers = setInterval(() => {
          if (projectUsers.length > 0) {
            clearInterval(checkUsers);
            resolve();
          }
        }, 100);
      });
    }

    const taskTitle = taskData.title;
    const taskId = taskData.id;
    const projectTitle = project?.title || 'Projet inconnu';
    const totalCost = taskData.totalCost || 0;
    const assignedEmails = taskData.assignedUserEmails || [];

    for (const userEmail of assignedEmails) {
      // Normalize email for comparison
      const normalizedEmail = userEmail?.toLowerCase()?.trim();
      if (!normalizedEmail) {
        console.warn(`Invalid email: ${userEmail}`);
        continue;
      }

      // Skip notification for the current user
      if (normalizedEmail === currentUser?.email?.toLowerCase()?.trim()) {
        console.log(`Skipping notification for current user: ${userEmail}`);
        continue;
      }

      // Find user by email among project users
      const user = projectUsers.find((u) => u.email?.toLowerCase()?.trim() === normalizedEmail);
      if (!user || !user.id) {
        console.warn(`No valid project user found for email: ${userEmail}`);
        continue;
      }

      try {
        await createNotification({
          userId: user.id,
          type: 'task',
          message: isEditing
            ? `Vous avez été assigné à la tâche "${taskTitle}" mise à jour dans le projet "${projectTitle}".`
            : `Vous avez été assigné à la nouvelle tâche "${taskTitle}" dans le projet "${projectTitle}".`,
          relatedEntityType: 'Task',
          relatedEntityId: taskId,
        });
        console.log(`Notification sent to user ${user.email} (ID: ${user.id}) for task: ${taskTitle}`);
      } catch (error) {
        console.error(`Failed to send notification to ${user.email}:`, error);
        setError(`Erreur lors de l'envoi de la notification à ${user.email}: ${error.message}`);
      }
    }

    // Dispatch newNotification event
    window.dispatchEvent(new Event('newNotification'));
  };

  // Reassign Incomplete Tasks
  useEffect(() => {
    const reassignIncompleteTasks = async () => {
      if (!sprints || !tasks || !projectId) return;
      const currentDate = new Date();
      const completedSprints = sprints.filter((sprint) => isSprintOverdue(sprint));
      const nextSprint = findNextUpcomingSprint(sprints, currentDate);

      if (!nextSprint) return;

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
              overdueFromSprint: sprint.name,
            };
            await dispatch(updateTask({ taskId: task.id, taskData, attachments: [] })).unwrap();

            const updatedSprintTasks = [...(nextSprint.taskIds || []), task.id];
            dispatch(updateSprint({
              sprintId: nextSprint.id,
              sprintData: { ...nextSprint, taskIds: updatedSprintTasks },
            }));

            const updatedCompletedSprintTasks = (sprint.taskIds || []).filter(
              (id) => id !== task.id
            );
            dispatch(updateSprint({
              sprintId: sprint.id,
              sprintData: { ...sprint, taskIds: updatedCompletedSprintTasks },
            }));

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
            console.error('[reassignIncompleteTasks] Error:', err);
            setError('Erreur lors du déplacement des tâches incomplètes.');
          }
        }
      }
    };

    reassignIncompleteTasks();
  }, [sprints, tasks, projectId, dispatch, currentUser, project, createNotification]);

  // Handlers
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

  const handleOpenItemDialog = (backlogId, item = null) => {
    const backlog = backlogs.find((b) => b.id === backlogId);
    setCurrentBacklog(backlog);
    setCurrentItem(item);
    setFormValues({
      name: '',
      description: item?.description || '',
      title: item?.title || '',
      assignedUsers: item
        ? projectUsers.filter((u) => item.assignedUserEmails?.includes(u.email))
        : [],
      priority: item?.priority || 'MEDIUM',
      status: item?.status || 'À faire',
      subtasks: item?.subtasks || [],
      sprintId: item?.sprintId || null,
      startDate: item?.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
      endDate: item?.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '',
      totalCost: item
        ? calculateTaskCost(
            projectUsers.filter((u) => item.assignedUserEmails?.includes(u.email)),
            item.startDate,
            item.endDate,
            item.status
          )
        : 0,
    });
    setItemDialogOpen(true);
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

  const handleOpenAddToSprintDialog = (backlogId, itemId) => {
    setSelectedBacklogForSprint(backlogId);
    setSelectedItemForSprint(itemId);
    setAddToSprintDialogOpen(true);
  };

  const handleOpenDeleteBacklogDialog = (backlogId) => {
    setBacklogToDelete(backlogId);
    setDeleteBacklogDialogOpen(true);
  };

  const handleOpenDeleteItemDialog = (taskId) => {
    setItemToDelete(taskId);
    setDeleteItemDialogOpen(true);
  };

  const handleOpenDeleteSprintDialog = (sprintId) => {
    setSprintToDelete(sprintId);
    setDeleteSprintDialogOpen(true);
  };

  const handleOpenTaskDetailsDialog = (task) => {
    setSelectedTask(task);
    setTaskDetailsDialogOpen(true);
  };

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
      setBacklogDialogOpen(false);
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
      setBacklogDialogOpen(false);
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
      setDeleteBacklogDialogOpen(false);
      const totalPages = Math.ceil((backlogs.length - 1) / backlogsPerPage);
      if (backlogPage > totalPages && totalPages > 0) {
        setBacklogPage(totalPages);
      } else if (totalPages === 0) {
        setBacklogPage(1);
      }
      const totalReviewPages = Math.ceil((backlogs.length - 1) / backlogsPerPage);
      if (sprintReviewPage > totalReviewPages && totalReviewPages > 0) {
        setSprintReviewPage(totalReviewPages);
      } else if (totalReviewPages === 0) {
        setSprintReviewPage(1);
      }
    } catch (err) {
      console.error('[handleDeleteBacklog] Error: ', err);
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
      const assignedUsers = formValues.assignedUsers.map((user) =>
        projectUsers.find((u) => u.email === user.email) || user
      );
      const totalCost = calculateTaskCost(
        assignedUsers,
        formValues.startDate,
        formValues.endDate,
        formValues.status
      );
      const taskData = {
        title: formValues.title,
        description: formValues.description || '',
        assignedUserEmails: assignedUsers.map((user) => user.email).filter(Boolean),
        priority: formValues.priority.toUpperCase(),
        status: formValues.status,
        projectId: parseInt(projectId),
        backlogIds: [parseInt(currentBacklog.id)],
        subtasks: formValues.subtasks.filter((subtask) => subtask.trim()),
        sprintId: formValues.sprintId,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        totalCost,
        createdIn: 'backlog',
      };
      const result = await dispatch(createTask({ taskData, attachments: [] })).unwrap();

      // Notify assigned users
      await notifyTaskUsers(result, false);

      await dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap();

      setItemDialogOpen(false);
    } catch (err) {
      console.error('[handleAddItem] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const assignedUsers = formValues.assignedUsers.map((user) =>
        projectUsers.find((u) => u.email === user.email) || user
      );
      const totalCost = calculateTaskCost(
        assignedUsers,
        formValues.startDate,
        formValues.endDate,
        formValues.status
      );
      const taskData = {
        title: formValues.title,
        description: formValues.description || '',
        assignedUserEmails: assignedUsers.map((user) => user.email).filter(Boolean),
        priority: formValues.priority.toUpperCase(),
        status: formValues.status,
        projectId: parseInt(projectId),
        backlogIds: currentItem.backlogIds || [],
        subtasks: formValues.subtasks.filter((subtask) => subtask.trim()),
        sprintId: formValues.sprintId || null,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        totalCost,
        createdIn: currentItem.createdIn || 'backlog',
      };

      const oldSprintId = currentItem.sprintId;
      const newSprintId = formValues.sprintId;
      const sprintChanged = oldSprintId !== newSprintId;

      const result = await dispatch(updateTask({
        taskId: currentItem.id,
        taskData,
        attachments: []
      })).unwrap();

      // Notify assigned users
      await notifyTaskUsers(result, true);

      const updatedTask = tasks.find((t) => t.id === currentItem.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }

      if (sprintChanged) {
        if (oldSprintId) {
          const oldSprint = sprints.find((s) => s.id === oldSprintId);
          if (oldSprint) {
            const updatedTaskIds = oldSprint.taskIds?.filter((id) => id !== currentItem.id) || [];
            await dispatch(updateSprint({
              sprintId: oldSprintId,
              sprintData: { ...oldSprint, taskIds: updatedTaskIds }
            }));
          }
        }

        if (newSprintId) {
          const newSprint = sprints.find((s) => s.id === newSprintId);
          if (newSprint) {
            const updatedTaskIds = [...(newSprint.taskIds || []), currentItem.id];
            await dispatch(updateSprint({
              sprintId: newSprintId,
              sprintData: { ...newSprint, taskIds: updatedTaskIds }
            }));
          }
        }
      }

      if (sprintChanged && taskData.assignedUserEmails?.length > 0) {
        const sprintName = sprints.find((s) => s.id === newSprintId)?.name || 'nouveau sprint';
        const oldSprintName = sprints.find((s) => s.id === oldSprintId)?.name || 'ancien sprint';
        for (const email of taskData.assignedUserEmails) {
          const user = projectUsers.find((u) => u.email === email);
          if (user && user.id && email !== currentUser?.email) {
            await createNotification({
              recipientUserId: user.id,
              type: 'task',
              message: `La tâche "${formValues.title}" a été déplacée ${oldSprintId ? `du sprint "${oldSprintName}" ` : ''}vers le sprint "${sprintName}" dans le projet "${project?.title || 'Projet inconnu'}". Coût estimé: ${totalCost.toFixed(2)} D.`,
              sender: { name: currentUser?.name || currentUser?.email, avatar: null },
              metadata: { taskId: currentItem.id },
            });
          }
        }
      }

      window.dispatchEvent(new Event('newNotification'));
      setItemDialogOpen(false);
    } catch (err) {
      console.error('[handleUpdateItem] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!formValues.name.trim()) {
      setError('Le nom du sprint est requis.');
      return;
    }
    if (!projectId || isNaN(parseInt(projectId))) {
      setError('ID du projet invalide.');
      return;
    }
    if (!formValues.startDate) {
      setError('La date de début est requise.');
      return;
    }
    if (!formValues.endDate) {
      setError('La date de fin est requise.');
      return;
    }
    if (new Date(formValues.endDate) <= new Date(formValues.startDate)) {
      setError('La date de fin doit être postérieure à la date de début.');
      return;
    }

    // Check for duplicate sprint name
    const sprintNameExists = sprints.some(
      (sprint) => sprint.name.toLowerCase() === formValues.name.trim().toLowerCase()
    );
    if (sprintNameExists) {
      setError('Un sprint avec ce nom existe déjà dans ce projet.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const sprintData = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || '',
        projectId: parseInt(projectId),
        startDate: new Date(formValues.startDate).toISOString(),
        endDate: new Date(formValues.endDate).toISOString(),
      };
      console.log('[handleCreateSprint] Prepared payload:', sprintData);
      const response = await dispatch(createSprint({ sprintData })).unwrap();
      console.log('[handleCreateSprint] Success response:', response);
      setSprintDialogOpen(false);
    } catch (err) {
      console.error('[handleCreateSprint] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
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
      setSprintDialogOpen(false);
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
      setDeleteSprintDialogOpen(false);
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

      setAddToSprintDialogOpen(false);
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

      const taskData = { ...task, status: newStatus };
      await dispatch(updateTask({ taskId, taskData, attachments: [] })).unwrap();

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

  const handleFormChange = (field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => {
          const newAssignedUsers = value
            ? value.map((selectedUser) =>
                projectUsers.find((u) => u.email === selectedUser.email) || selectedUser
              )
            : [];
          const totalCost = calculateTaskCost(
            newAssignedUsers,
            prev.startDate,
            prev.endDate,
            prev.status
          );
          return { ...prev, [field]: newAssignedUsers, totalCost };
        });
      } else if (field === 'startDate' || field === 'endDate') {
        setFormValues((prev) => {
          const newValues = { ...prev, [field]: event.target.value };
          const totalCost = calculateTaskCost(
            prev.assignedUsers,
            newValues.startDate,
            newValues.endDate,
            prev.status
          );
          return { ...newValues, totalCost };
        });
      } else if (field === 'subtasks') {
        setFormValues((prev) => ({ ...prev, [field]: value }));
      } else {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      }
    } catch (err) {
      console.error('[handleFormChange] Error:', err);
      setError('Erreur lors de la mise à jour du formulaire.');
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

  const handleDeleteItem = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteTask(itemToDelete)).unwrap();
      setDeleteItemDialogOpen(false);
    } catch (err) {
      console.error('[handleDeleteItem] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearErrors = () => {
    dispatch(clearTasksError());
    setError('');
    dispatch(fetchBacklogs({ projectId: parseInt(projectId) }));
    dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
    dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) }));
    dispatch(fetchSprints({ projectId: parseInt(projectId) }));
  };

  return {
    project,
    projectUsers,
    loading,
    error,
    activeTab,
    setActiveTab,
    backlogDialogOpen,
    setBacklogDialogOpen,
    itemDialogOpen,
    setItemDialogOpen,
    sprintDialogOpen,
    setSprintDialogOpen,
    addToSprintDialogOpen,
    setAddToSprintDialogOpen,
    deleteBacklogDialogOpen,
    setDeleteBacklogDialogOpen,
    deleteItemDialogOpen,
    setDeleteItemDialogOpen,
    deleteSprintDialogOpen,
    setDeleteSprintDialogOpen,
    taskDetailsDialogOpen,
    setTaskDetailsDialogOpen,
    currentBacklog,
    setCurrentBacklog,
    currentItem,
    setCurrentItem,
    currentSprint,
    setCurrentSprint,
    selectedItemForSprint,
    setSelectedItemForSprint,
    selectedBacklogForSprint,
    setSelectedBacklogForSprint,
    itemToDelete,
    setItemToDelete,
    backlogToDelete,
    setBacklogToDelete,
    sprintToDelete,
    setSprintToDelete,
    selectedTask,
    setSelectedTask,
    formValues,
    setFormValues,
    isSubmitting,
    setIsSubmitting,
    backlogPage,
    setBacklogPage,
    sprintPage,
    setSprintPage,
    sprintReviewPage,
    setSprintReviewPage,
    backlogsPerPage,
    sprintsPerPage,
    users,
    tasks,
    taskStatus,
    taskError,
    columns,
    columnStatus,
    columnError,
    backlogs,
    sprints,
    currentUser,
    generateInitials,
    getAvatarColor,
    createNotification,
    handleTabChange,
    handleOpenBacklogDialog,
    handleOpenItemDialog,
    handleOpenSprintDialog,
    handleOpenAddToSprintDialog,
    handleOpenDeleteBacklogDialog,
    handleOpenDeleteItemDialog,
    handleOpenDeleteSprintDialog,
    handleOpenTaskDetailsDialog,
    handleAddBacklog,
    handleUpdateBacklog,
    handleDeleteBacklog,
    handleAddItem,
    handleUpdateItem,
    handleCreateSprint,
    handleUpdateSprint,
    handleDeleteSprint,
    handleAddToSprint,
    handleUpdateSprintItemStatus,
    handleFormChange,
    handleAddSubtask,
    handleSubtaskChange,
    handleRemoveSubtask,
    handleDeleteItem,
    clearErrors,
    notifyTaskUsers,
  };
};