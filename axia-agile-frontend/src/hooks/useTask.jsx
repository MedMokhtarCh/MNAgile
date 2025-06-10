import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { createTask, updateTask, fetchAllTasks } from '../store/slices/taskSlice';
import { calculateTaskCost } from '../utils/estimatedcost-tasks';
import { normalizePriority } from '../utils/normalize';

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.endsWith('Z')) {
      return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() - timezoneOffset);
    return adjustedDate.toISOString();
  } catch {
    return null;
  }
};

export const useTask = ({ projectId, project, currentUser, projectUsers, createNotification }) => {
  const dispatch = useDispatch();

  // Task-related state
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [kanbanError, setKanbanError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dialogMode, setDialogMode] = useState('view');
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    assignedUsers: [],
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    attachments: [],
    columnName: '',
    columnId: null,
    backlogIds: [],
    totalCost: 0,
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [taskStatus, setTaskStatus] = useState('idle');
  const [taskError, setTaskError] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!projectId || isNaN(parseInt(projectId))) {
      setKanbanError('ID du projet invalide');
      setTaskStatus('failed');
      return;
    }
    setTaskStatus('loading');
    setTaskError(null);
    try {
      await dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap();
      setTaskStatus('succeeded');
    } catch (err) {
      console.error('[useTask] Failed to fetch tasks:', err);
      setTaskError(err.message || 'Erreur lors du chargement des tâches');
      setTaskStatus('failed');
    }
  }, [dispatch, projectId, setKanbanError]);

  // Handle subtasks
  const handleAddSubtask = useCallback(() => {
    if (newSubtask.trim()) {
      setSubtasks((prev) => [...prev, { title: newSubtask, completed: false }]);
      setNewSubtask('');
    }
  }, [newSubtask]);

  const handleRemoveSubtask = useCallback((index) => {
    setSubtasks((prev) => {
      const updatedSubtasks = [...prev];
      updatedSubtasks.splice(index, 1);
      return updatedSubtasks;
    });
    if (editingSubtaskIndex === index) {
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
    }
  }, [editingSubtaskIndex]);

  const handleToggleSubtask = useCallback((index) => {
    setSubtasks((prev) => {
      const updatedSubtasks = [...prev];
      updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
      return updatedSubtasks;
    });
  }, []);

  const handleEditSubtask = useCallback((index) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(subtasks[index].title);
  }, [subtasks]);

  const handleSaveSubtaskEdit = useCallback((index) => {
    if (editingSubtaskText.trim()) {
      setSubtasks((prev) => {
        const updatedSubtasks = [...prev];
        updatedSubtasks[index].title = editingSubtaskText.trim();
        return updatedSubtasks;
      });
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
    }
  }, [editingSubtaskText]);

  const handleCancelSubtaskEdit = useCallback(() => {
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  }, []);

  // Handle task creation dialog
  const handleAddTask = useCallback((columnName, backlogFilter, selectedBacklog) => {
    try {
      setCurrentColumn(columnName);
      setIsEditing(false);
      setDialogMode('edit');
      setEditingTask(null);
      setFormValues({
        title: '',
        description: '',
        assignedUsers: [],
        priority: 'MEDIUM',
        startDate: '',
        endDate: '',
        attachments: [],
        backlogIds: backlogFilter !== 'all' && backlogFilter !== 'none' && selectedBacklog ? [parseInt(selectedBacklog.id)] : [],
        totalCost: 0,
      });
      setSubtasks([]);
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
      setDialogOpen(true);
    } catch (err) {
      console.error('[handleAddTask] Error:', err);
      setKanbanError('Erreur lors de l\'ouverture du formulaire de tâche.');
    }
  }, []);

  // Handle edit task
  const handleEditTask = useCallback((task) => {
    try {
      setCurrentColumn(task.status);
      setIsEditing(true);
      setDialogMode('edit');
      const totalCost = calculateTaskCost(
        projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
        task.startDate,
        task.endDate,
        task.status
      );
      setEditingTask({ ...task, totalCost });
      setFormValues({
        title: task.title || '',
        description: task.description || '',
        assignedUsers: projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
        priority: normalizePriority(task.priority),
        startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : '',
        endDate: task.endDate ? new Date(task.endDate).toISOString().slice(0, 16) : '',
        attachments: [],
        backlogIds: task.backlogIds || [],
        totalCost,
      });
      setSubtasks(task.subtasks?.map(title => ({ title, completed: false })) || []);
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
      setDialogOpen(true);
    } catch (err) {
      console.error('[handleEditTask] Error:', err);
      setKanbanError('Erreur lors de l\'ouverture du formulaire de modification.');
    }
  }, [projectUsers]);

  // Handle form changes
  const handleFormChange = useCallback((field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => {
          const newAssignedUsers = value || [];
          const totalCost = calculateTaskCost(
            newAssignedUsers,
            prev.startDate,
            prev.endDate,
            prev.status || currentColumn
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
            prev.status || currentColumn
          );
          return { ...newValues, totalCost };
        });
      } else if (field === 'attachments') {
        const files = Array.from(event.target.files);
        setFormValues((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...files],
          totalCost: prev.totalCost ?? 0,
        }));
      } else if (field === 'backlogIds') {
        setFormValues((prev) => ({
          ...prev,
          backlogIds: value || [],
          totalCost: prev.totalCost ?? 0,
        }));
      } else {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      }
    } catch (err) {
      console.error('[useTask] Error handling form change:', err);
      setKanbanError('Erreur lors de la mise à jour du formulaire.');
    }
  }, [currentColumn]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((attachmentId) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => `file-${index}` !== attachmentId),
      totalCost: prev.totalCost ?? 0,
    }));
  }, []);

  // Notify users assigned to a task
  const notifyTaskUsers = useCallback(
    async (taskData, isEditing) => {
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
          setKanbanError(`Erreur lors de l'envoi de la notification à ${user.email}: ${error.message}`);
        }
      }

      // Dispatch newNotification event
      window.dispatchEvent(new Event('newNotification'));
    },
    [createNotification, currentUser, projectUsers, project, setKanbanError]
  );

  // Create task
  const handleCreateTask = useCallback(
    async (columns) => {
      if (!currentColumn || !formValues.title || !projectId) {
        setKanbanError('Le titre, la colonne et l\'ID du projet sont requis.');
        return;
      }
      const validColumn = columns.find((col) => col.name === currentColumn);
      if (!validColumn) {
        setKanbanError(`Le statut "${currentColumn}" n'est pas valide pour ce projet.`);
        return;
      }
      setIsCreatingTask(true);
      setKanbanError('');
      try {
        const totalCost = calculateTaskCost(
          formValues.assignedUsers,
          formValues.startDate,
          formValues.endDate,
          currentColumn
        );
        const taskData = {
          title: formValues.title,
          description: formValues.description,
          assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
          priority: normalizePriority(formValues.priority),
          startDate: parseDate(formValues.startDate),
          endDate: parseDate(formValues.endDate),
          status: currentColumn,
          projectId: parseInt(projectId),
          backlogIds: formValues.backlogIds.filter((id) => id),
          subtasks: subtasks.map((subtask) => subtask.title).filter((title) => title.trim()),
          metadata: { createdIn: 'kanban' },
          displayOrder: formValues.displayOrder || 0,
          totalCost,
        };
        const result = await dispatch(createTask({ taskData, attachments: formValues.attachments })).unwrap();

        // Notify assigned users
        await notifyTaskUsers(result, false);

        setFormValues({
          title: '',
          description: '',
          assignedUsers: [],
          priority: 'MEDIUM',
          startDate: '',
          endDate: '',
          attachments: [],
          backlogIds: [],
          totalCost: 0,
        });
        setSubtasks([]);
        setEditingTask({ ...result, attachments: result.attachments || [], totalCost });
        setDialogMode('view');
        setIsEditing(false);
        setDialogOpen(false);
      } catch (err) {
        console.error('[handleCreateTask] Error:', err);
        const errorMessage =
          typeof err === 'string'
            ? err
            : err.message ||
              err.response?.data?.message ||
              err.response?.data?.title ||
              (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
              'Erreur lors de la création de la tâche';
        setKanbanError(errorMessage);
      } finally {
        setIsCreatingTask(false);
      }
    },
    [currentColumn, formValues, projectId, subtasks, dispatch, notifyTaskUsers, setKanbanError]
  );

  // Update task
  const handleUpdateTask = useCallback(
    async () => {
      if (!editingTask || !formValues.title || !projectId) {
        setKanbanError('Le titre et l\'ID du projet sont requis.');
        return;
      }
      setIsCreatingTask(true);
      setKanbanError('');
      try {
        const totalCost = calculateTaskCost(
          formValues.assignedUsers,
          formValues.startDate,
          formValues.endDate,
          currentColumn || editingTask.status
        );
        const taskData = {
          title: formValues.title,
          description: formValues.description,
          assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean) || [],
          priority: normalizePriority(formValues.priority),
          startDate: parseDate(formValues.startDate),
          endDate: parseDate(formValues.endDate),
          status: currentColumn || editingTask.status || 'À faire',
          projectId: parseInt(projectId),
          backlogIds: formValues.backlogIds || [],
          subtasks: subtasks.map((subtask) => subtask.title),
          metadata: { createdIn: 'kanban' },
          totalCost,
        };
        const result = await dispatch(updateTask({ taskId: editingTask.id, taskData, attachments: formValues.attachments })).unwrap();

        // Notify assigned users
        await notifyTaskUsers(result, true);

        setFormValues({
          title: result.title || '',
          description: result.description || '',
          assignedUsers: projectUsers.filter((u) => result.assignedUserEmails?.includes(u.email)) || [],
          priority: normalizePriority(result.priority),
          startDate: result.startDate ? new Date(result.startDate).toISOString().slice(0, 16) : '',
          endDate: result.endDate ? new Date(result.endDate).toISOString().slice(0, 16) : '',
          attachments: [],
          backlogIds: result.backlogIds || [],
          totalCost: result.totalCost ?? 0,
        });
        setSubtasks(result.subtasks?.map((title) => ({ title, completed: false })) || []);
        setEditingTask({ ...result, attachments: result.attachments || [], totalCost });
        setDialogMode('view');
        setIsEditing(false);
      } catch (err) {
        console.error('[handleUpdateTask] Error:', err);
        const errorMessage =
          typeof err === 'string'
            ? err
            : err.message ||
              err.errors?.join(', ') ||
              err.response?.data?.message ||
              err.response?.data?.title ||
              (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
              'Erreur lors de la mise à jour de la tâche';
        setKanbanError(errorMessage);
      } finally {
        setIsCreatingTask(false);
      }
    },
    [editingTask, formValues, projectId, currentColumn, projectUsers, subtasks, dispatch, notifyTaskUsers, setKanbanError]
  );

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setFormValues({
      title: '',
      description: '',
      assignedUsers: [],
      priority: 'MEDIUM',
      startDate: '',
      endDate: '',
      attachments: [],
      columnName: '',
      columnId: null,
      backlogIds: [],
      totalCost: 0,
    });
    setSubtasks([]);
    setNewSubtask('');
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
    setCurrentColumn(null);
    setIsEditing(false);
    setEditingTask(null);
    setDialogMode('view');
    setKanbanError('');
  }, []);

  return {
    isCreatingTask,
    kanbanError,
    setKanbanError,
    dialogOpen,
    setDialogOpen,
    currentColumn,
    setCurrentColumn,
    isEditing,
    setIsEditing,
    editingTask,
    setEditingTask,
    dialogMode,
    setDialogMode,
    formValues,
    setFormValues,
    subtasks,
    setSubtasks,
    newSubtask,
    setNewSubtask,
    editingSubtaskIndex,
    editingSubtaskText,
    setEditingSubtaskText,
    handleAddSubtask,
    handleRemoveSubtask,
    handleToggleSubtask,
    handleEditSubtask,
    handleSaveSubtaskEdit,
    handleCancelSubtaskEdit,
    handleAddTask,
    handleEditTask,
    handleFormChange,
    handleRemoveAttachment,
    handleCreateTask,
    handleUpdateTask,
    handleDialogClose,
    fetchTasks,
    taskStatus,
    taskError,
    notifyTaskUsers, 
  };
};