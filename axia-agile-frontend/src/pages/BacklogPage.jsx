import React, { useState, useEffect, Component } from 'react';
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
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useParams } from 'react-router-dom';
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
} from '../store/slices/taskSlice';
import { projectApi } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

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

// Normalize project data
const normalizeProject = (project) => ({
  id: String(project.id || project.Id || ''),
  title: project.title || project.Title || '',
  description: project.description || project.Description || '',
  methodology: project.methodology || project.Methodology || '',
  createdAt: project.createdAt || project.CreatedAt || new Date().toISOString(),
  startDate: project.startDate || project.StartDate || new Date().toISOString(),
  endDate: project.endDate || project.EndDate || new Date().toISOString(),
  createdBy: project.createdBy || project.CreatedBy || '',
  projectManagers: project.projectManagers || project.ProjectManagers || [],
  productOwners: project.productOwners || project.ProductOwners || [],
  scrumMasters: project.scrumMasters || project.ScrumMasters || [],
  users: project.developers || project.Developers || [],
  testers: project.testers || project.Testers || [],
  observers: project.observers || project.Observers || [],
});

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Une erreur est survenue : {this.state.error?.message || 'Erreur inconnue'}.
            Veuillez réessayer ou contacter le support.
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Main BacklogPage Component
function BacklogPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();
  const { currentUser } = useAuth();

  // Redux state
  const { backlogs, tasks, columns, status, error: reduxError } = useSelector((state) => state.tasks);

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
  const [currentBacklog, setCurrentBacklog] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedItemForSprint, setSelectedItemForSprint] = useState(null);
  const [selectedBacklogForSprint, setSelectedBacklogForSprint] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    title: '',
    assignedUsers: [],
    priority: 'MEDIUM',
    status: 'À faire',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sprint state (using localStorage)
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints
      ? JSON.parse(savedSprints)
      : [
          {
            id: 1,
            name: 'Sprint 1 - Authentication',
            startDate: '2025-03-01',
            endDate: '2025-03-14',
            isActive: false,
            items: [],
          },
          {
            id: 2,
            name: 'Sprint 2 - Dashboard',
            startDate: '2025-03-15',
            endDate: '2025-03-28',
            isActive: false,
            items: [],
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('sprints', JSON.stringify(sprints));
  }, [sprints]);

  // Fetch project, backlogs, tasks, columns, and users
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
    });
    setBacklogDialogOpen(true);
  };

  const handleCloseBacklogDialog = () => {
    setBacklogDialogOpen(false);
    setCurrentBacklog(null);
    setFormValues({ name: '', description: '', title: '', assignedUsers: [], priority: 'MEDIUM', status: 'À faire' });
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
    });
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setCurrentItem(null);
    setFormValues({ name: '', description: '', title: '', assignedUsers: [], priority: 'MEDIUM', status: 'À faire' });
    setError('');
  };

  const handleOpenSprintDialog = () => {
    setFormValues({ name: '', description: '', title: '', assignedUsers: [], priority: 'MEDIUM', status: 'À faire' });
    setSprintDialogOpen(true);
  };

  const handleCloseSprintDialog = () => {
    setSprintDialogOpen(false);
    setFormValues({ name: '', description: '', title: '', assignedUsers: [], priority: 'MEDIUM', status: 'À faire' });
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

  const handleToggleSprintActive = (sprintId) => {
    setSprints(sprints.map((sprint) =>
      sprint.id === sprintId ? { ...sprint, isActive: !sprint.isActive } : sprint
    ));
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

  const handleDeleteBacklog = async (backlogId) => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteBacklog({ backlogId })).unwrap();
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
        createdIn: 'backlog', // Mark task as created in backlog
      };
      console.log('[handleAddItem] Creating task with payload:', taskData);
      const result = await dispatch(createTask({ taskData, attachments: [] })).unwrap();
      console.log('[handleAddItem] Created task:', result);

      // Link the task to the backlog
      await dispatch(linkTaskToBacklog({ backlogId: parseInt(currentBacklog.id), taskId: result.id })).unwrap();

      // Update the backlog's taskIds in the Redux store
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

  const handleDeleteItem = async (taskId) => {
    setIsSubmitting(true);
    setError('');
    try {
      await dispatch(deleteTask(taskId)).unwrap();
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

  const handleAddToSprint = (sprintId) => {
    const backlog = backlogs.find((b) => b.id === selectedBacklogForSprint);
    if (!backlog) return;
    const task = tasks.find((t) => t.id === selectedItemForSprint);
    if (!task) return;
    const newItem = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status || 'À faire',
      assignees: task.assignedUserEmails.map((email) => projectUsers.find((u) => u.email === email)?.email || email),
    };
    setSprints(sprints.map((sprint) =>
      sprint.id === sprintId ? { ...sprint, items: [...sprint.items, newItem] } : sprint
    ));
    handleCloseAddToSprintDialog();
  };

  const handleCreateSprint = () => {
    const name = document.getElementById('sprint-name').value;
    const startDate = document.getElementById('sprint-start-date').value;
    const endDate = document.getElementById('sprint-end-date').value;
    if (!name.trim()) {
      setError('Le nom du sprint est requis.');
      return;
    }
    const newSprint = {
      id: Math.max(0, ...sprints.map((s) => s.id)) + 1,
      name,
      startDate,
      endDate,
      isActive: false,
      items: [],
    };
    setSprints([...sprints, newSprint]);
    handleCloseSprintDialog();
  };

  const handleUpdateSprintItemStatus = (sprintId, itemId, newStatus) => {
    setSprints(sprints.map((sprint) =>
      sprint.id === sprintId
        ? {
            ...sprint,
            items: sprint.items.map((item) =>
              item.id === itemId ? { ...item, status: newStatus } : item
            ),
          }
        : sprint
    ));
  };

  // Form change handler
  const handleFormChange = (field) => (event, value) => {
    if (field === 'assignedUsers') {
      setFormValues((prev) => ({ ...prev, [field]: value || [] }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  // Render backlog item
  const renderBacklogItem = (backlogId, task) => (
    <TaskItem key={task.id}>
      <DragIndicatorIcon sx={{ color: '#bdbdbd', mr: 1 }} />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{task.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {task.description}
        </Typography>
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
        <IconButton
          size="small"
          onClick={() => handleOpenAddToSprintDialog(backlogId, task.id)}
          title="Ajouter au sprint"
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleOpenItemDialog(backlogId, task)}
          title="Modifier"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteItem(task.id)}
          title="Supprimer"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </TaskItem>
  );

  // Render sprint item
  const renderSprintItem = (sprintId, item) => (
    <TaskItem key={item.id}>
      <DragIndicatorIcon sx={{ color: '#bdbdbd', mr: 1 }} />
      <Checkbox
        checked={item.status === 'COMPLETED'}
        onChange={() =>
          handleUpdateSprintItemStatus(
            sprintId,
            item.id,
            item.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED'
          )
        }
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{item.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </Box>
      <Chip
        label={
          item.status === 'À faire'
            ? 'À faire'
            : item.status === 'IN_PROGRESS'
            ? 'En cours'
            : 'Terminé'
        }
        size="small"
        color={
          item.status === 'COMPLETED'
            ? 'success'
            : item.status === 'IN_PROGRESS'
            ? 'primary'
            : 'default'
        }
        sx={{ mr: 1 }}
      />
      <AvatarGroup max={3} sx={{ mr: 1 }}>
        {item.assignees?.map((email) => {
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
      <IconButton size="small" title="Modifier">
        <EditIcon fontSize="small" />
      </IconButton>
    </TaskItem>
  );

  // Render backlog tab
  const renderBacklogTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Backlogs du Produit</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenBacklogDialog()}
        >
          Nouveau Backlog
        </Button>
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
              }}
            >
              Réessayer
            </Button>
          }
        >
          {error || reduxError}
        </Alert>
      )}
      {backlogs.map((backlog) => (
        <BacklogContainer key={backlog.id}>
          <BacklogHeader>
            <Box>
              <Typography variant="h6">{backlog.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {backlog.description}
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={() => handleOpenBacklogDialog(backlog)}
                title="Modifier le backlog"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteBacklog(backlog.id)}
                title="Supprimer le backlog"
                disabled={isSubmitting}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenItemDialog(backlog.id)}
                size="small"
                sx={{ ml: 1 }}
              >
                Ajouter Item
              </Button>
            </Box>
          </BacklogHeader>
          <BacklogContent>
            {backlog.taskIds.length > 0 ? (
              tasks
                .filter((task) => backlog.taskIds.includes(task.id))
                .map((task) => renderBacklogItem(backlog.id, task))
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Aucun item dans ce backlog. Cliquez sur "Ajouter Item" pour commencer.
              </Typography>
            )}
          </BacklogContent>
        </BacklogContainer>
      ))}
    </Box>
  );

  // Render sprints tab
  const renderSprintsTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Sprints</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenSprintDialog}
        >
          Nouveau Sprint
        </Button>
      </Box>
      {sprints.map((sprint) => (
        <StyledPaper key={sprint.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">{sprint.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sprint.startDate} à {sprint.endDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                {sprint.items.length} tâches • {sprint.items.filter((i) => i.status === 'COMPLETED').length} terminées
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={sprint.isActive}
                    onChange={() => handleToggleSprintActive(sprint.id)}
                    color="primary"
                  />
                }
                label="Activer"
              />
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {sprint.items.length > 0 ? (
            sprint.items.map((item) => renderSprintItem(sprint.id, item))
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Aucune tâche dans ce sprint. Ajoutez des tâches depuis le backlog.
            </Typography>
          )}
        </StyledPaper>
      ))}
    </Box>
  );

  // Render backlog dialog
  const renderBacklogDialog = () => (
    <Dialog open={backlogDialogOpen} onClose={handleCloseBacklogDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentBacklog ? 'Modifier le backlog' : 'Créer un nouveau backlog'}
      </DialogTitle>
      <DialogContent>
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
      </DialogContent>
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
    <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentItem ? 'Modifier l\'item' : 'Ajouter un nouvel item'}
      </DialogTitle>
      <DialogContent>
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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="assignees-label">Membres assignés</InputLabel>
          <Select
            labelId="assignees-label"
            multiple
            value={formValues.assignedUsers}
            onChange={(e) => handleFormChange('assignedUsers')(e, e.target.value)}
            label="Membres assignés"
            disabled={isSubmitting}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((user) => (
                  <Chip key={user.email} label={user.name} size="small" />
                ))}
              </Box>
            )}
          >
            {projectUsers.map((user) => (
              <MenuItem key={user.email} value={user}>
                <Checkbox checked={formValues.assignedUsers.some((u) => u.email === user.email)} />
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
      </DialogContent>
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
    <Dialog open={sprintDialogOpen} onClose={handleCloseSprintDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un nouveau sprint</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="sprint-name"
          label="Nom du sprint"
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            id="sprint-start-date"
            label="Date de début"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            defaultValue={new Date().toISOString().split('T')[0]}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
          <TextField
            id="sprint-end-date"
            label="Date de fin"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            defaultValue={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSprintDialog} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateSprint}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Traitement...' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render add to sprint dialog
  const renderAddToSprintDialog = () => (
    <Dialog open={addToSprintDialogOpen} onClose={handleCloseAddToSprintDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter au sprint</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseAddToSprintDialog}>Annuler</Button>
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
      <Box sx={{ p: 3 }}>
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
    <ErrorBoundary>
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
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f9fafb' }}>
          {activeTab === 'backlog' && renderBacklogTab()}
          {activeTab === 'sprints' && renderSprintsTab()}
        </Box>
        {renderBacklogDialog()}
        {renderItemDialog()}
        {renderSprintDialog()}
        {renderAddToSprintDialog()}
      </Box>
    </ErrorBoundary>
  );
}

export default BacklogPage;