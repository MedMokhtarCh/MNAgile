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
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBacklogs,
  createBacklog,
  updateBacklog,
  deleteBacklog,
  linkTaskToBacklog,
  unlinkTaskFromBacklog,
  fetchAllTasks,
  createTask,
  updateTask,
  deleteTask,
  clearTasksError,
  fetchKanbanColumns,
  updateBacklogTaskIds,
  fetchSprints,
  createSprint,
  updateSprint,
  deleteSprint,
} from '../store/slices/taskSlice';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/common/PageTitle';
import InputUserAssignment from '../components/common/InputUserAssignment';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const TaskItem = styled(Box)(({ theme, isDragging }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  marginBottom: theme.spacing(1.5),
  backgroundColor: isDragging ? '#f0f7ff' : '#fff',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderColor: '#bbdefb',
  },
}));

const BacklogContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  overflow: 'hidden',
}));

const BacklogHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const BacklogContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const ScrollableContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  '-ms-overflow-style': 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  bgcolor: '#fff',
}));

const FormDialogContent = styled(DialogContent)(({ theme }) => ({
  overflowY: 'auto',
  scrollbarWidth: 'none',
  '-ms-overflow-style': 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

// Sortable Task Item Component
const SortableTaskItem = ({ task, backlogId, renderBacklogItem, isSprint }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {renderBacklogItem(backlogId, task, isDragging, listeners, isSprint)}
    </div>
  );
};

// Main BacklogPage Component
function BacklogPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redux state
  const { backlogs, tasks, columns, sprints, status, error: reduxError } = useSelector((state) => state.tasks);

  // Local state
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
  const [currentBacklog, setCurrentBacklog] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [selectedItemForSprint, setSelectedItemForSprint] = useState(null);
  const [selectedBacklogForSprint, setSelectedBacklogForSprint] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [backlogToDelete, setBacklogToDelete] = useState(null);
  const [sprintToDelete, setSprintToDelete] = useState(null);
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

  // Drag-and-Drop Setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Redirect if user lacks necessary permissions
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

  // Custom handleDragEnd to enforce two-position movement
  const customHandleDragEnd = (event) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveDragId(null);

    if (!active || !over || !active.id || !over.id) {
      console.log('[customHandleDragEnd] Invalid drag event', { active, over });
      return;
    }

    try {
      const activeIdValue = active.id.toString();
      const overId = over.id.toString();

      if (activeIdValue === overId) {
        console.log('[customHandleDragEnd] No change (same position)');
        return;
      }

      // Find the active task
      const activeTask = tasks.find((task) => task.id.toString() === activeIdValue);
      if (!activeTask) {
        console.error('[customHandleDragEnd] Active task not found:', activeIdValue);
        return;
      }

      // Determine source and destination containers
      const sourceContainer = backlogs.find((b) => b.taskIds.includes(activeTask.id)) ||
                             sprints.find((s) => s.taskIds?.includes(activeTask.id));
      const overTask = tasks.find((t) => t.id.toString() === overId);
      const destContainer = overTask
        ? (backlogs.find((b) => b.taskIds.includes(overTask.id)) ||
           sprints.find((s) => s.taskIds?.includes(overTask.id)))
        : (backlogs.find((b) => b.id.toString() === overId) ||
           sprints.find((s) => s.id.toString() === overId));

      if (!sourceContainer || !destContainer) {
        console.error('[customHandleDragEnd] Source or destination container not found');
        return;
      }

      const isSourceBacklog = 'description' in sourceContainer;
      const isDestBacklog = 'description' in destContainer;

      // Handle reordering within the same container
      if (sourceContainer.id === destContainer.id) {
        const taskIds = [...(sourceContainer.taskIds || [])];
        const sourceIndex = taskIds.findIndex((id) => id.toString() === activeIdValue);
        let destIndex = overTask
          ? taskIds.findIndex((id) => id.toString() === overId)
          : taskIds.length;

        if (sourceIndex === -1 || destIndex === -1) {
          console.error('[customHandleDragEnd] Invalid indices:', { sourceIndex, destIndex });
          return;
        }

        // Enforce two-position movement
        const direction = destIndex > sourceIndex ? 2 : -2;
        destIndex = sourceIndex + direction;
        if (destIndex < 0) destIndex = 0;
        if (destIndex >= taskIds.length) destIndex = taskIds.length - 1;

        if (sourceIndex !== destIndex) {
          const newTaskIds = arrayMove(taskIds, sourceIndex, destIndex);
          console.log('[customHandleDragEnd] New task order:', newTaskIds);

          if (isSourceBacklog) {
            dispatch(updateBacklogTaskIds({
              backlogId: sourceContainer.id,
              taskIds: newTaskIds,
            }));
          } else {
            dispatch(updateSprint({
              sprintId: sourceContainer.id,
              sprintData: { ...sourceContainer, taskIds: newTaskIds },
            }));
          }

          dispatch(updateTask({
            taskId: activeTask.id,
            taskData: { ...activeTask, displayOrder: destIndex },
            attachments: [],
          }));
        }
      } else {
        // Handle moving between containers
        const sourceTaskIds = [...(sourceContainer.taskIds || [])];
        const destTaskIds = [...(destContainer.taskIds || [])];
        const sourceIndex = sourceTaskIds.findIndex((id) => id.toString() === activeIdValue);
        const destIndex = overTask
          ? destTaskIds.findIndex((id) => id.toString() === overId)
          : destTaskIds.length;

        if (sourceIndex === -1) {
          console.error('[customHandleDragEnd] Source task not found in source container');
          return;
        }

        sourceTaskIds.splice(sourceIndex, 1);
        destTaskIds.splice(destIndex, 0, activeTask.id);

        console.log('[customHandleDragEnd] Moving task:', {
          taskId: activeTask.id,
          from: sourceContainer.name,
          to: destContainer.name,
        });

        if (isSourceBacklog) {
          dispatch(updateBacklogTaskIds({
            backlogId: sourceContainer.id,
            taskIds: sourceTaskIds,
          }));
        } else {
          dispatch(updateSprint({
            sprintId: sourceContainer.id,
            sprintData: { ...sourceContainer, taskIds: sourceTaskIds },
          }));
        }

        if (isDestBacklog) {
          dispatch(updateBacklogTaskIds({
            backlogId: destContainer.id,
            taskIds: destTaskIds,
          }));
        } else {
          dispatch(updateSprint({
            sprintId: destContainer.id,
            sprintData: { ...destContainer, taskIds: destTaskIds },
          }));
        }

        const updatedTaskData = {
          ...activeTask,
          sprintId: isDestBacklog ? null : destContainer.id,
          backlogIds: isDestBacklog ? [destContainer.id] : activeTask.backlogIds.filter(id => id !== sourceContainer.id),
          displayOrder: destIndex,
          projectId: parseInt(projectId),
        };

        dispatch(updateTask({
          taskId: activeTask.id,
          taskData: updatedTaskData,
          attachments: [],
        }));

        if (activeTask.assignedUserEmails && Array.isArray(activeTask.assignedUserEmails)) {
          activeTask.assignedUserEmails.forEach((email) => {
            if (email && email !== currentUser?.email) {
              createNotification({
                recipient: email,
                type: 'task',
                message: `La tâche "${activeTask.title}" a été déplacée de "${sourceContainer.name}" à "${destContainer.name}" dans le projet "${project?.title || 'Projet inconnu'}".`,
                sender: { name: currentUser?.name || currentUser?.email, avatar: null },
                metadata: { taskId: activeTask.id },
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('[customHandleDragEnd] Error during drag-and-drop:', err);
      setError('Erreur lors du déplacement. Veuillez réessayer.');
    }
  };

  // Initialize useDragAndDrop hook
  const {
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    getActiveTask,
    isDragging,
    activeDragId,
  } = useDragAndDrop({
    backlogs,
    sprints,
    tasks,
    projectId,
    dispatch,
    createNotification,
    currentUser,
    project,
    setError,
  });

  // Fetch project, backlogs, tasks, columns, sprints, and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!projectId || isNaN(parseInt(projectId))) {
          throw new Error('ID du projet invalide');
        }

        console.log('[BacklogPage] Fetching data for projectId:', projectId);
        const projectResponse = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(projectResponse.data);
        setProject(normalizedProject);

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

        const projectUsersData = projectUserEmails.map((email) => ({
          email,
          firstName: '',
          lastName: '',
          name: email,
        }));

        setProjectUsers(projectUsersData);
      } catch (err) {
        console.error('[BacklogPage] Error:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data,
          } : null,
        });
        setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, dispatch]);

  // Notify users of task creation
  const createTaskNotification = (userEmail, taskTitle, taskId) => {
    createNotification({
      recipient: userEmail,
      type: 'task',
      message: `Vous avez été assigné à la tâche "${taskTitle}" dans le projet "${project?.title || 'Projet inconnu'}".`,
      sender: {
        name: currentUser.name || currentUser.email,
        avatar: null,
      },
      metadata: {
        taskId,
      },
    });
  };

  // Notify users of task updates
  const updateTaskNotification = (userEmail, taskTitle, taskId) => {
    createNotification({
      recipient: userEmail,
      type: 'task',
      message: `La tâche "${taskTitle}" a été mise à jour dans le projet "${project?.title || 'Projet inconnu'}".`,
      sender: {
        name: currentUser.name || currentUser.email,
        avatar: null,
      },
      metadata: {
        taskId,
      },
    });
  };

  // Handlers UI
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

  // Handlers for backend operations
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
      console.error('[handleAddBacklog] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la création du backlog';
      setError(errorMessage);
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
      handleCloseBacklogDialog();
    } catch (err) {
      console.error('[handleUpdateBacklog] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la mise à jour du backlog';
      setError(errorMessage);
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
      console.error('[handleDeleteBacklog] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la suppression du backlog';
      setError(errorMessage);
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
      console.log('[handleAddItem] Creating task with payload:', taskData);
      const result = await dispatch(createTask({ taskData, attachments: [] })).unwrap();
      console.log('[handleAddItem] Created task:', result);

      await dispatch(linkTaskToBacklog({ backlogId: parseInt(currentBacklog.id), taskId: result.id })).unwrap();

      dispatch(updateBacklogTaskIds({
        backlogId: parseInt(currentBacklog.id),
        taskId: result.id,
      }));

      formValues.assignedUsers.forEach((user) => {
        if (user.email) {
          createTaskNotification(user.email, formValues.title, result.id);
        }
      });
      handleCloseItemDialog();
    } catch (err) {
      console.error('[handleAddItem] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (err.response?.data?.errors && Object.values(err.response?.data?.errors).join(', ')) ||
        err.message ||
        'Erreur lors de la création de la tâche';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async () => {
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
        backlogIds: currentItem?.backlogIds || [parseInt(currentBacklog.id)],
        subtasks: formValues.subtasks.filter((subtask) => subtask.trim()),
        sprintId: formValues.sprintId || null,
        kanbanColumnId: currentItem?.kanbanColumnId || null,
      };
      console.log('[handleUpdateItem] Updating task with payload:', taskData);
      const result = await dispatch(updateTask({ taskId: currentItem.id, taskData, attachments: [] })).unwrap();
      formValues.assignedUsers.forEach((user) => {
        if (user.email) {
          updateTaskNotification(user.email, formValues.title, result.id);
        }
      });
      handleCloseItemDialog();
    } catch (err) {
      console.error('[handleUpdateItem] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (err.response?.data?.errors && Object.values(err.response?.data?.errors).join(', ')) ||
        err.message ||
        'Erreur lors de la mise à jour de la tâche';
      setError(errorMessage);
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
      console.error('[handleDeleteItem] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message ||
        'Erreur lors de la suppression de la tâche';
      setError(errorMessage);
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
      console.error('[handleCreateSprint] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la création du sprint';
      setError(errorMessage);
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
      console.error('[handleUpdateSprint] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la mise à jour du sprint';
      setError(errorMessage);
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
      console.error('[handleDeleteSprint] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la suppression du sprint';
      setError(errorMessage);
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

      // Update sprint taskIds
      const sprint = sprints.find((s) => s.id === sprintId);
      if (sprint) {
        const newTaskIds = [...(sprint.taskIds || []), task.id];
        dispatch(updateSprint({
          sprintId,
          sprintData: { ...sprint, taskIds: newTaskIds },
        }));
      }

      // Notify assigned users
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
      console.error('[handleAddToSprint] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de l’ajout au sprint';
      setError(errorMessage);
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
      const taskData = {
        ...task,
        status: newStatus,
      };
      await dispatch(updateTask({ taskId, taskData, attachments: [] })).unwrap();
    } catch (err) {
      console.error('[handleUpdateSprintItemStatus] Error:', {
        message: err.message,
        response: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination handlers
  const handleBacklogPageChange = (event, value) => {
    setBacklogPage(value);
  };

  const handleSprintPageChange = (event, value) => {
    setSprintPage(value);
  };

  // Form change handler
  const handleFormChange = (field) => (event, value) => {
    if (field === 'assignedUsers') {
      setFormValues((prev) => ({ ...prev, [field]: value || [] }));
    } else if (field === 'subtasks') {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  // Subtask handlers
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

  // Modified renderBacklogItem to support drag-and-drop and conditional buttons
  const renderBacklogItem = (backlogId, task, isDragging = false, listeners, isSprint = false) => (
    <TaskItem isDragging={isDragging}>
      <DragIndicatorIcon
        sx={{ color: '#bdbdbd', mr: 1, cursor: 'grab' }}
        {...listeners}
      />
      {isSprint && (
        <Checkbox
          checked={task.status === 'COMPLETED'}
          onChange={() =>
            handleUpdateSprintItemStatus(
              task.id,
              task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED'
            )
          }
        />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{task.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {task.description}
        </Typography>
        {task.subtasks?.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Sous-tâches :
            </Typography>
            <List dense>
              {task.subtasks.map((subtask, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText primary={subtask} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
      <AvatarGroup max={3} sx={{ mr: 1 }}>
        {task.assignedUserEmails?.map((email) => {
          const user = projectUsers.find((u) => u.email === email);
          return user ? (
            <Tooltip key={email} title={user.name}>
              <Avatar alt={user.name} sx={{ bgcolor: getAvatarColor(user.name) }}>
                {generateInitials(user.name)}
              </Avatar>
            </Tooltip>
          ) : null;
        })}
      </AvatarGroup>
      <Box sx={{ display: 'flex' }}>
        {!isSprint && currentUser?.claims?.includes('CanCreateTasks') && (
          <IconButton
            size="small"
            onClick={() => handleOpenAddToSprintDialog(backlogId, task.id)}
            title="Ajouter au sprint"
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        )}
        {currentUser?.claims?.includes('CanUpdateTasks') && (
          <IconButton
            size="small"
            onClick={() => handleOpenItemDialog(backlogId, task)}
            title="Modifier"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {currentUser?.claims?.includes('CanDeleteTasks') && (
          <IconButton
            size="small"
            onClick={() => handleOpenDeleteItemDialog(task.id)}
            title="Supprimer"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </TaskItem>
  );

  // Render sprint item
  const renderSprintItem = (task) => (
    <SortableTaskItem
      task={task}
      backlogId={task.backlogIds[0] || null}
      renderBacklogItem={renderBacklogItem}
      isSprint={true}
    />
  );

  // Render backlog tab
  const renderBacklogTab = () => {
    const startIndex = (backlogPage - 1) * backlogsPerPage;
    const endIndex = startIndex + backlogsPerPage;
    const paginatedBacklogs = backlogs.slice(startIndex, endIndex);
    const totalBacklogPages = Math.ceil(backlogs.length / backlogsPerPage);

    const droppableIds = [
      ...paginatedBacklogs.map((backlog) => backlog.id.toString()),
      ...tasks.map((task) => task.id.toString()),
    ];

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={customHandleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={droppableIds} strategy={verticalListSortingStrategy}>
          <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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
                {paginatedBacklogs.map((backlog) => (
                  <BacklogContainer key={backlog.id} id={backlog.id.toString()}>
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
                      {backlog.taskIds.length > 0 ? (
                        <SortableContext
                          items={backlog.taskIds.map((id) => id.toString())}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasks
                            .filter((task) => backlog.taskIds.includes(task.id))
                            .map((task) => (
                              <SortableTaskItem
                                key={task.id}
                                task={task}
                                backlogId={backlog.id}
                                renderBacklogItem={renderBacklogItem}
                              />
                            ))}
                        </SortableContext>
                      ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          Aucun item dans ce backlog. {currentUser?.claims?.includes('CanCreateTasks') ? 'Cliquez sur "Ajouter Item" pour commencer.' : ''}
                        </Typography>
                      )}
                    </BacklogContent>
                  </BacklogContainer>
                ))}
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
        </SortableContext>
      </DndContext>
    );
  };

  // Render sprints tab
  const renderSprintsTab = () => {
    const startIndex = (sprintPage - 1) * sprintsPerPage;
    const endIndex = startIndex + sprintsPerPage;
    const paginatedSprints = sprints.slice(startIndex, endIndex);
    const totalSprintPages = Math.ceil(sprints.length / sprintsPerPage);

    const droppableIds = [
      ...paginatedSprints.map((sprint) => sprint.id.toString()),
      ...tasks.map((task) => task.id.toString()),
    ];

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={customHandleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={droppableIds} strategy={verticalListSortingStrategy}>
          <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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
                  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id);
                  return (
                    <StyledPaper key={sprint.id} id={sprint.id.toString()}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{sprint.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sprint.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sprint.startDate} à {sprint.endDate}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 2 }}>
                            {sprintTasks.length} tâches • {sprintTasks.filter((t) => t.status === 'COMPLETED').length} terminées
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
                      {sprintTasks.length > 0 ? (
                        <SortableContext
                          items={sprintTasks.map((task) => task.id.toString())}
                          strategy={verticalListSortingStrategy}
                        >
                          {sprintTasks.map((task) => renderSprintItem(task))}
                        </SortableContext>
                      ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          Aucune tâche dans ce sprint. Ajoutez des tâches depuis le backlog.
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
        </SortableContext>
      </DndContext>
    );
  };

  // Render backlog dialog
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

  // Render item dialog
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
                <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                <MenuItem value="COMPLETED">Terminé</MenuItem>
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

  // Render sprint dialog
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

  // Render add to sprint dialog
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

  // Render delete backlog confirmation dialog
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

  // Render delete item confirmation dialog
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

  // Render delete sprint confirmation dialog
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3, bgcolor: '#fff' }}>
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
    </Box>
  );
}

export default BacklogPage;