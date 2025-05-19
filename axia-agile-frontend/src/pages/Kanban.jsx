import React, { useState, useEffect, useCallback, createContext } from 'react';
import {
  Box, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select as MuiSelect, OutlinedInput,
  useMediaQuery, useTheme, Grid, Container, Alert, CircularProgress, Autocomplete,
  MenuItem, Chip, Avatar, List, ListItem, ListItemText, IconButton, Divider,
  Checkbox, ListItemIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Flag from '@mui/icons-material/Flag';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanCard from '../components/kanban/KanbanCard';
import KanbanFilters from '../components/kanban/KanbanFilters';
import InputUserAssignment from '../components/common/InputUserAssignment';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { fetchAllTasks, fetchKanbanColumns, createKanbanColumn, updateKanbanColumn, deleteKanbanColumn, createTask, updateTask, deleteTask, clearTasksError, fetchBacklogs } from '../store/slices/taskSlice';
import { useAuth } from '../contexts/AuthContext';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';
import PageTitle from '../components/common/PageTitle';

export const KanbanContext = createContext();

// Styled components
const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
  padding: theme.spacing(0.8, 1.8),
  fontWeight: 500,
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    msOverflowStyle: 'none',
  },
  '& .MuiDialog-paper': {
    borderRadius: 12,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[10],
  },
}));

// Normalize priority value
const normalizePriority = (priority) => {
  if (!priority) return 'MEDIUM';
  const priorityMap = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return priorityMap[priority.toUpperCase()] || 'MEDIUM';
};

function Kanban() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();
  const { currentUser } = useAuth();

  // Redux state
  const { tasks, columns, backlogs, status: taskStatus, error: taskError } = useSelector((state) => state.tasks);

  // Local state
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kanbanError, setKanbanError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [backlogFilter, setBacklogFilter] = useState('all');
  const [selectedBacklog, setSelectedBacklog] = useState(null);
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
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');

  // Drag-and-drop logic
  const { handleDragStart, handleDragEnd, getActiveTask, getActiveColumn } = useDragAndDrop({
    columns,
    tasks,
    projectId,
    dispatch,
    createNotification,
    currentUser,
    project,
    setKanbanError,
  });

  // Map tasks to columns, filtered by backlogFilter
  const columnsByStatus = columns.reduce((acc, col) => {
    acc[col.name] = tasks.filter((task) => {
      const matchesStatus = task.status === col.name;
      let matchesBacklog = true;
      if (backlogFilter === 'none') {
        matchesBacklog = !task.backlogIds || task.backlogIds.length === 0;
      } else if (backlogFilter !== 'all' && selectedBacklog) {
        matchesBacklog = task.backlogIds?.includes(parseInt(selectedBacklog.id));
      }
      return matchesStatus && matchesBacklog;
    });
    return acc;
  }, {});

  // Filter tasks by user and priority
  const filteredColumns = columns.reduce((acc, col) => {
    acc[col.name] = (columnsByStatus[col.name] || []).filter((task) => {
      const matchesUser = selectedUser ? task.assignedUserEmails?.includes(selectedUser) : true;
      const matchesPriority = selectedPriority ? normalizePriority(task.priority).toLowerCase() === selectedPriority.toLowerCase() : true;
      return matchesUser && matchesPriority;
    });
    return acc;
  }, {});

  // Fetch project, tasks, columns, and backlogs
  const loadData = useCallback(async () => {
    setLoading(true);
    setKanbanError('');
    try {
      if (!projectId || isNaN(parseInt(projectId))) {
        throw new Error('ID du projet invalide');
      }
      const projectResponse = await projectApi.get(`/Projects/${projectId}`);
      const normalizedProject = normalizeProject(projectResponse.data);
      setProject(normalizedProject);

      await Promise.all([
        dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap(),
        dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) })).unwrap(),
        dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap(),
      ]);

      const projectUserEmails = [
        ...(normalizedProject.projectManagers || []),
        ...(normalizedProject.productOwners || []),
        ...(normalizedProject.scrumMasters || []),
        ...(normalizedProject.users || []),
        ...(normalizedProject.testers || []),
        ...(normalizedProject.observers || []),
      ].filter((email, index, self) => email && self.indexOf(email) === index && typeof email === 'string' && email.includes('@'));

      const projectUsersData = projectUserEmails.map((email) => ({
        email,
        firstName: '',
        lastName: '',
        name: email,
      }));

      setProjectUsers(projectUsersData);
    } catch (err) {
      console.error('[loadData] Error:', err);
      if (err.response?.status === 401) {
        setKanbanError('Non autorisé. Veuillez vous reconnecter.');
        navigate('/login', { replace: true });
      } else if (err.response?.status === 404) {
        setKanbanError(`Le projet avec l'ID ${projectId} n'existe pas.`);
        navigate('/projects');
      } else {
        setKanbanError(`Erreur lors du chargement des données: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle subtasks
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks.splice(index, 1);
    setSubtasks(updatedSubtasks);
    if (editingSubtaskIndex === index) {
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
    }
  };

  const handleToggleSubtask = (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    setSubtasks(updatedSubtasks);
  };

  const handleEditSubtask = (index) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(subtasks[index].title);
  };

  const handleSaveSubtaskEdit = (index) => {
    if (editingSubtaskText.trim()) {
      const updatedSubtasks = [...subtasks];
      updatedSubtasks[index].title = editingSubtaskText.trim();
      setSubtasks(updatedSubtasks);
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
    }
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  };

  // Notify users of task creation
  const createTaskNotification = (userEmail, taskTitle, taskId) => {
    createNotification({
      recipient: userEmail,
      type: 'task',
      message: `Vous avez été assigné à la tâche "${taskTitle}" dans le projet "${project?.title || 'Projet inconnu'}".`,
      sender: { name: currentUser.name || currentUser.email, avatar: null },
      metadata: { taskId },
    });
  };

  // Notify users of task updates
  const updateTaskNotification = (userEmail, taskTitle, taskId) => {
    createNotification({
      recipient: userEmail,
      type: 'task',
      message: `La tâche "${taskTitle}" a été mise à jour dans le projet "${project?.title || 'Projet inconnu'}".`,
      sender: { name: currentUser.name || currentUser.email, avatar: null },
      metadata: { taskId },
    });
  };

  // Handle task creation dialog
  const handleAddTask = (columnName) => {
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
      });
      setSubtasks([]);
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
      setDialogOpen(true);
    } catch (err) {
      console.error('[handleAddTask] Error:', err);
      setKanbanError('Erreur lors de l\'ouverture du formulaire de tâche.');
    }
  };

  // Handle edit task
  const handleEditTask = (task) => {
    try {
      setCurrentColumn(task.status);
      setIsEditing(true);
      setDialogMode('edit');
      setEditingTask(task);
      setFormValues({
        title: task.title || '',
        description: task.description || '',
        assignedUsers: projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
        priority: normalizePriority(task.priority),
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
        attachments: [],
        backlogIds: task.backlogIds || [],
      });
      setSubtasks(task.subtasks?.map(title => ({ title, completed: false })) || []);
      setEditingSubtaskIndex(null);
      setEditingSubtaskText('');
      setDialogOpen(true);
    } catch (err) {
      console.error('[handleEditTask] Error:', err);
      setKanbanError('Erreur lors de l\'ouverture du formulaire de modification.');
    }
  };

  // Handle edit column
  const handleEditColumn = (column) => {
    setDialogMode('editColumn');
    setFormValues({ ...formValues, columnName: column.name, columnId: column.id });
    setDialogOpen(true);
  };

  // Handle delete column
  const handleDeleteColumn = async (columnId) => {
    try {
    
      const column = columns.find((col) => col.id === columnId);
      if (column) {
        const tasksInColumn = tasks.filter((task) => task.status === column.name);
        for (const task of tasksInColumn) {
          await dispatch(deleteTask(task.id)).unwrap();
        }
      }
     
      await dispatch(deleteKanbanColumn({ columnId })).unwrap();
    } catch (err) {
      console.error('[handleDeleteColumn] Error:', err);
      setKanbanError('Erreur lors de la suppression de la colonne.');
    }
  };

  // Handle form changes
  const handleFormChange = (field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => ({ ...prev, [field]: value || [] }));
      } else if (field === 'attachments') {
        const files = Array.from(event.target.files);
        setFormValues((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
      } else if (field === 'columnName') {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      } else if (field === 'priority') {
        setFormValues((prev) => ({ ...prev, [field]: normalizePriority(event.target.value) }));
      } else {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      }
    } catch (err) {
      console.error('[Kanban] Error handling form change:', err);
      setKanbanError('Erreur lors de la mise à jour du formulaire.');
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (attachmentId) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => `file-${index}` !== attachmentId),
    }));
  };

  // Safe date parsing
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  };

  // Create task
// In Kanban.js, modify handleCreateTask and handleUpdateTask for clarity
const handleCreateTask = async () => {
  if (!currentColumn || !formValues.title || !projectId) {
    setKanbanError('Le titre, la colonne et l\'ID du projet sont requis.');
    return;
  }
  setIsCreatingTask(true);
  setKanbanError('');
  try {
    const taskData = {
      title: formValues.title,
      description: formValues.description,
      assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean) || [], // Explicitly optional
      priority: normalizePriority(formValues.priority),
      startDate: parseDate(formValues.startDate),
      endDate: parseDate(formValues.endDate),
      status: currentColumn || 'À faire',
      projectId: parseInt(projectId),
      backlogIds: formValues.backlogIds || [],
      subtasks: subtasks.map(subtask => subtask.title),
      metadata: { createdIn: 'kanban' },
    };

    const result = await dispatch(createTask({ taskData, attachments: formValues.attachments })).unwrap();

    // Notify assigned users (if any)
    formValues.assignedUsers.forEach((user) => {
      if (user.email) createTaskNotification(user.email, formValues.title, result.id);
    });

    // Reset form and update state
    setFormValues({
      title: '',
      description: '',
      assignedUsers: [], // Reset to empty array
      priority: 'MEDIUM',
      startDate: '',
      endDate: '',
      attachments: [],
      backlogIds: [],
    });
    setSubtasks([]);
    setEditingTask({ ...result, attachments: result.attachments || [] });
    setDialogMode('view');
    setIsEditing(false);
    setDialogOpen(false); // Close dialog after successful creation
  } catch (err) {
    console.error('[handleCreateTask] Error:', err);
    const errorMessage =
      typeof err === 'string' ? err :
      err.message ||
      err.response?.data?.message ||
      err.response?.data?.title ||
      (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
      'Erreur lors de la création de la tâche';
    setKanbanError(errorMessage);
  } finally {
    setIsCreatingTask(false);
  }
};

const handleUpdateTask = async () => {
  if (!editingTask || !formValues.title || !projectId) {
    setKanbanError('Le titre et l\'ID du projet sont requis.');
    return;
  }
  setIsCreatingTask(true);
  setKanbanError('');
  try {
    const taskData = {
      title: formValues.title,
      description: formValues.description,
      assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean) || [], // Explicitly optional
      priority: normalizePriority(formValues.priority),
      startDate: parseDate(formValues.startDate),
      endDate: parseDate(formValues.endDate),
      status: currentColumn || editingTask.status || 'À faire',
      projectId: parseInt(projectId),
      backlogIds: formValues.backlogIds || [],
      subtasks: subtasks.map(subtask => subtask.title),
      metadata: { createdIn: 'kanban' },
    };

    const result = await dispatch(updateTask({ taskId: editingTask.id, taskData, attachments: formValues.attachments })).unwrap();

    formValues.assignedUsers.forEach((user) => {
      if (user.email) updateTaskNotification(user.email, formValues.title, result.id);
    });
    setFormValues({
      title: result.title || '',
      description: result.description || '',
      assignedUsers: projectUsers.filter((u) => result.assignedUserEmails?.includes(u.email)) || [],
      priority: normalizePriority(result.priority),
      startDate: result.startDate ? new Date(result.startDate).toISOString().split('T')[0] : '',
      endDate: result.endDate ? new Date(result.endDate).toISOString().split('T')[0] : '',
      attachments: [],
      backlogIds: result.backlogIds || [],
    });
    setSubtasks(result.subtasks?.map(title => ({ title, completed: false })) || []);
    setEditingTask({ ...result, attachments: result.attachments || [] });
    setDialogMode('view');
    setIsEditing(false);
  } catch (err) {
    console.error('[handleUpdateTask] Error:', err);
    const errorMessage =
      typeof err === 'string' ? err :
      err.message ||
      err.errors?.join(', ') ||
      err.response?.data?.message ||
      err.response?.data?.title ||
      (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
      'Erreur lors de la mise à jour de la tâche';
    setKanbanError(errorMessage);
  } finally {
    setIsCreatingTask(false);
  }
};

  // Handle dialog close
  const handleDialogClose = () => {
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
  };

  // Handle form submission for columns
  const handleFormSubmit = async () => {
    try {
      if (dialogMode === 'addColumn' || dialogMode === 'editColumn') {
        if (!formValues.columnName.trim()) {
          setKanbanError('Le nom de la colonne est requis.');
          return;
        }
        if (dialogMode === 'addColumn') {
          await dispatch(createKanbanColumn({
            columnData: { name: formValues.columnName, projectId: parseInt(projectId), displayOrder: columns.length + 1 },
          })).unwrap();
        } else {
          await dispatch(updateKanbanColumn({
            columnId: formValues.columnId,
            columnData: { name: formValues.columnName },
          })).unwrap();
        }
        handleDialogClose();
        return;
      }
      if (isEditing) {
        await handleUpdateTask();
      } else {
        await handleCreateTask();
      }
    } catch (err) {
      console.error('[handleFormSubmit] Error:', err);
      const errorMessage =
        typeof err === 'string' ? err :
        err.message ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        'Erreur lors de la soumission du formulaire';
      setKanbanError(errorMessage);
    }
  };

  // Handle user filter
  const handleUserFilterChange = (event, value) => {
    setSelectedUser(value ? value.email : '');
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (normalizePriority(priority).toLowerCase()) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  // Retry fetching data
  const handleRetryFetch = () => {
    dispatch(clearTasksError());
    setKanbanError('');
    loadData();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={handleRetryFetch}>Réessayer</Button>}
        >
          {kanbanError || 'Projet introuvable.'}
        </Alert>
      </Container>
    );
  }

  return (
    <KanbanContext.Provider value={{ setDialogOpen, setFormValues, setCurrentColumn, setIsEditing, setEditingTask, setDialogMode, handleEditTask }}>
      <Box sx={{ 
        minHeight: '100vh',
        width: '100%', 
      }}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <PageTitle>
              Tableau Kanban pour le projet {project.title}
            </PageTitle>
            <StyledButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setDialogMode('addColumn');
                setFormValues((prev) => ({ ...prev, columnName: '' }));
                setDialogOpen(true);
              }}
            >
              Ajouter une colonne
            </StyledButton>
          </Box>
          {(kanbanError || taskError) && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              action={<Button color="inherit" size="small" onClick={handleRetryFetch}>Réessayer</Button>}
            >
              {kanbanError || taskError}
            </Alert>
          )}
          {taskStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={40} />
            </Box>
          )}
          <KanbanFilters
            backlogs={backlogs}
            projectUsers={projectUsers}
            selectedUser={selectedUser}
            selectedPriority={selectedPriority}
            backlogFilter={backlogFilter}
            selectedBacklog={selectedBacklog}
            setBacklogFilter={setBacklogFilter}
            setSelectedBacklog={setSelectedBacklog}
            setSelectedPriority={setSelectedPriority}
            handleUserFilterChange={handleUserFilterChange}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
            setDialogMode={setDialogMode}
            setFormValues={setFormValues}
            setDialogOpen={setDialogOpen}
          />
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={(event) => {
              setActiveId(handleDragStart(event));
            }}
            onDragEnd={(event) => {
              handleDragEnd(event);
            }}
            sensors={sensors}
          >
            <SortableContext
              items={columns.map(col => col.id.toString())}
              strategy={horizontalListSortingStrategy}
            >
              <Box
                sx={{
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  msOverflowStyle: 'none',
                }}
              >
                <Grid
                  container
                  spacing={2}
                  sx={{
                    flexWrap: 'nowrap',
                    minWidth: `${columns.length * 300}px`,
                    pb: 2,
                    alignItems: 'flex-start',
                  }}
                >
                  {[...columns].sort((a, b) => a.displayOrder - b.displayOrder).map((column) => (
                    <Grid item key={column.id}>
                      <KanbanColumn
                        column={column}
                        columns={columns}
                        filteredColumns={filteredColumns}
                        users={projectUsers}
                        handleAddTask={handleAddTask}
                        handleEditColumn={handleEditColumn}
                        handleDeleteColumn={handleDeleteColumn}
                        handleEditTask={handleEditTask}
                        getAvatarColor={getAvatarColor}
                        generateInitials={generateInitials}
                        getPriorityLabel={getPriorityLabel}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                getActiveTask(activeId) ? (
                  <KanbanCard
                    task={getActiveTask(activeId)}
                    users={projectUsers}
                    isOverlay
                    getPriorityLabel={getPriorityLabel}
                    getAvatarColor={getAvatarColor}
                    generateInitials={generateInitials}
                  />
                ) : getActiveColumn(activeId) ? (
                  <KanbanColumn
                    column={getActiveColumn(activeId)}
                    columns={columns}
                    filteredColumns={filteredColumns}
                    users={projectUsers}
                    handleAddTask={handleAddTask}
                    handleEditColumn={handleEditColumn}
                    handleDeleteColumn={handleDeleteColumn}
                    handleEditTask={handleEditTask}
                    getAvatarColor={getAvatarColor}
                    generateInitials={generateInitials}
                    getPriorityLabel={getPriorityLabel}
                  />
                ) : null
              ) : null}
            </DragOverlay>
          </DndContext>
          <StyledDialog
            open={dialogOpen}
            onClose={(event, reason) => {
              if (reason !== 'backdropClick') {
                handleDialogClose();
              }
            }}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
          >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {dialogMode === 'addColumn' ? 'Ajouter une colonne' : 
               dialogMode === 'editColumn' ? `Modifier la colonne: ${formValues.columnName}` : 
               dialogMode === 'view' ? `Détails de la tâche: ${editingTask?.title || ''}` : 
               isEditing ? `Modifier la tâche: ${editingTask?.title || ''}` : 
               `Nouvelle tâche dans ${currentColumn || 'À faire'}`}
              <IconButton onClick={handleDialogClose} disabled={isCreatingTask}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {isCreatingTask && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              )}
              {kanbanError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {kanbanError}
                </Alert>
              )}
              <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {dialogMode === 'addColumn' || dialogMode === 'editColumn' ? (
                  <TextField
                    autoFocus
                    label="Nom de la colonne"
                    variant="outlined"
                    fullWidth
                    required
                    value={formValues.columnName}
                    onChange={handleFormChange('columnName')}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    disabled={isCreatingTask}
                    error={!formValues.columnName}
                    helperText={!formValues.columnName ? 'Le nom de la colonne est requis' : ''}
                  />
                ) : dialogMode === 'view' ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Informations principales</Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Titre</Typography>
                          <Typography variant="body1">{formValues.title || 'Non défini'}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                          <Typography variant="body1">{formValues.description || 'Aucune description'}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Priorité</Typography>
                          <Typography variant="body1">{getPriorityLabel(formValues.priority)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Backlog associé</Typography>
                          <Typography variant="body1">
                            {formValues.backlogIds?.length > 0
                              ? backlogs.find((b) => formValues.backlogIds.includes(b.id))?.name || 'Backlog inconnu'
                              : 'Aucun backlog'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Détails supplémentaires</Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Date de début</Typography>
                          <Typography variant="body1">{formValues.startDate || 'Non définie'}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Date de fin</Typography>
                          <Typography variant="body1">{formValues.endDate || 'Non définie'}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Assigné à</Typography>
                          {formValues.assignedUsers.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {formValues.assignedUsers.map((user) => (
                                <Chip
                                  key={user.email}
                                  avatar={<Avatar sx={{ bgcolor: getAvatarColor(user.email) }}>{generateInitials(user.email)}</Avatar>}
                                  label={user.email}
                                  size="small"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body1">Aucun utilisateur assigné</Typography>
                          )}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Sous-tâches</Typography>
                          {editingTask?.subtasks?.length > 0 ? (
                            <List dense>
                              {editingTask.subtasks.map((subtask, index) => (
                                <ListItem key={`view-subtask-${index}`}>
                                  <ListItemIcon>
                                    <Checkbox edge="start" checked={false} disabled />
                                  </ListItemIcon>
                                  <ListItemText primary={subtask} />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body1">Aucune sous-tâche</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Pièces jointes</Typography>
                          {editingTask?.attachments?.length > 0 ? (
                            <List dense>
                              {editingTask.attachments.map((attachment, index) => (
                                <ListItem
                                  key={`server-attachment-${index}`}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      onClick={() => window.open(`${attachment.filePath}`, '_blank')}
                                      disabled={isCreatingTask}
                                    >
                                      <FileDownloadIcon fontSize="small" />
                                    </IconButton>
                                  }
                                >
                                  <ListItemText
                                    primary={attachment.fileName}
                                    secondary={`Uploaded on ${new Date(attachment.uploadedAt).toLocaleString()}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body1">Aucune pièce jointe</Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                          label="Titre"
                          variant="outlined"
                          fullWidth
                          required
                          value={formValues.title}
                          onChange={handleFormChange('title')}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                          disabled={isCreatingTask}
                          error={!formValues.title}
                          helperText={!formValues.title ? 'Le titre est requis' : ''}
                        />
                        <TextField
                          label="Description"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={4}
                          value={formValues.description}
                          onChange={handleFormChange('description')}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                          disabled={isCreatingTask}
                        />
                        <FormControl fullWidth>
                          <InputLabel id="task-priority-label">Priorité</InputLabel>
                          <MuiSelect
                            labelId="task-priority-label"
                            value={formValues.priority}
                            onChange={handleFormChange('priority')}
                            input={<OutlinedInput label="Priorité" />}
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                            disabled={isCreatingTask}
                          >
                            <MenuItem value="HIGH">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Flag sx={{ color: theme.palette.error.main, mr: 1 }} fontSize="small" />
                                Haute
                              </Box>
                            </MenuItem>
                            <MenuItem value="MEDIUM">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Flag sx={{ color: theme.palette.warning.main, mr: 1 }} fontSize="small" />
                                Moyenne
                              </Box>
                            </MenuItem>
                            <MenuItem value="LOW">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Flag sx={{ color: theme.palette.success.main, mr: 1 }} fontSize="small" />
                                Basse
                              </Box>
                            </MenuItem>
                          </MuiSelect>
                        </FormControl>
                        <Autocomplete
                          options={[{ id: 'none', name: 'Aucun backlog' }, ...backlogs]}
                          getOptionLabel={(option) => option.name}
                          renderOption={(props, option) => (
                            <li {...props}>
                              <Typography variant="body2">{option.name}</Typography>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Backlog associé"
                              variant="outlined"
                              sx={{ bgcolor: 'white', borderRadius: 1 }}
                            />
                          )}
                          value={
                            formValues.backlogIds.length === 0
                              ? { id: 'none', name: 'Aucun backlog' }
                              : backlogs.find((b) => formValues.backlogIds.includes(b.id)) || { id: 'none', name: 'Aucun backlog' }
                          }
                          onChange={(event, value) => {
                            setFormValues((prev) => ({
                              ...prev,
                              backlogIds: value && value.id !== 'none' ? [parseInt(value.id)] : [],
                            }));
                          }}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          disabled={isCreatingTask}
                        />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Sous-tâches</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={newSubtask}
                              onChange={(e) => setNewSubtask(e.target.value)}
                              placeholder="Ajouter une sous-tâche"
                              disabled={isCreatingTask}
                            />
                            <Button
                              variant="outlined"
                              onClick={handleAddSubtask}
                              disabled={!newSubtask.trim() || isCreatingTask}
                            >
                              Ajouter
                            </Button>
                          </Box>
                          <List dense>
                            {subtasks.map((subtask, index) => (
                              <ListItem
                                key={`subtask-${index}`}
                                secondaryAction={
                                  <Box>
                                    {editingSubtaskIndex === index ? (
                                      <>
                                        <IconButton
                                          edge="end"
                                          onClick={() => handleSaveSubtaskEdit(index)}
                                          disabled={!editingSubtaskText.trim() || isCreatingTask}
                                        >
                                          <CheckIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          edge="end"
                                          onClick={handleCancelSubtaskEdit}
                                          disabled={isCreatingTask}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    ) : (
                                      <>
                                        <IconButton
                                          edge="end"
                                          onClick={() => handleEditSubtask(index)}
                                          disabled={isCreatingTask}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          edge="end"
                                          onClick={() => handleRemoveSubtask(index)}
                                          disabled={isCreatingTask}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    )}
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  <Checkbox
                                    edge="start"
                                    checked={subtask.completed}
                                    onChange={() => handleToggleSubtask(index)}
                                    disabled={isCreatingTask || editingSubtaskIndex === index}
                                  />
                                </ListItemIcon>
                                {editingSubtaskIndex === index ? (
                                  <TextField
                                    size="small"
                                    value={editingSubtaskText}
                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                    autoFocus
                                    fullWidth
                                    disabled={isCreatingTask}
                                  />
                                ) : (
                                  <ListItemText
                                    primary={subtask.title}
                                    sx={{ textDecoration: subtask.completed ? 'line-through' : 'none' }}
                                  />
                                )}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                          label="Date de début"
                          type="date"
                          variant="outlined"
                          fullWidth
                          value={formValues.startDate}
                          onChange={handleFormChange('startDate')}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                          disabled={isCreatingTask}
                        />
                        <TextField
                          label="Date de fin"
                          type="date"
                          variant="outlined"
                          fullWidth
                          value={formValues.endDate}
                          onChange={handleFormChange('endDate')}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                          disabled={isCreatingTask}
                        />
                        <InputUserAssignment
                          options={projectUsers}
                          value={formValues.assignedUsers}
                          onChange={(event, value) => handleFormChange('assignedUsers')(event, value)}
                          label="Assigné à"
                          placeholder="Sélectionner des utilisateurs"
                          getAvatarColor={getAvatarColor}
                          generateInitials={generateInitials}
                          disabled={isCreatingTask}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Pièces jointes</Typography>
                          {editingTask?.attachments?.length > 0 && (
                            <List dense>
                              {editingTask.attachments.map((attachment, index) => (
                                <ListItem
                                  key={`server-attachment-${index}`}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      onClick={() => window.open(`${attachment.filePath}`, '_blank')}
                                      disabled={isCreatingTask}
                                    >
                                      <FileDownloadIcon fontSize="small" />
                                    </IconButton>
                                  }
                                >
                                  <ListItemText
                                    primary={attachment.fileName}
                                    secondary={`Uploaded on ${new Date(attachment.uploadedAt).toLocaleString()}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFileIcon />}
                            sx={{ mb: 1, borderRadius: 1 }}
                            disabled={isCreatingTask}
                          >
                            Ajouter un fichier
                            <input
                              type="file"
                              hidden
                              multiple
                              onChange={handleFormChange('attachments')}
                              accept="image/*,.pdf,.doc,.docx"
                              disabled={isCreatingTask}
                            />
                          </Button>
                          <List dense>
                            {formValues.attachments.map((attachment, index) => (
                              <ListItem
                                key={`file-${index}`}
                                secondaryAction={
                                  <IconButton edge="end" onClick={() => handleRemoveAttachment(`file-${index}`)} disabled={isCreatingTask}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                }
                              >
                                <ListItemText
                                  primary={attachment.name}
                                  secondary={`${(attachment.size / 1024).toFixed(2)} KB`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
              <StyledButton
                onClick={handleDialogClose}
                variant="outlined"
                sx={{ bgcolor: 'white', borderRadius: 1 }}
                disabled={isCreatingTask}
              >
                {dialogMode === 'view' ? 'Fermer' : 'Annuler'}
              </StyledButton>
              {dialogMode !== 'view' && (
                <StyledButton
                  onClick={handleFormSubmit}
                  variant="contained"
                  disabled={isCreatingTask || (dialogMode === 'edit' && !formValues.title) || (dialogMode === 'addColumn' && !formValues.columnName) || (dialogMode === 'editColumn' && !formValues.columnName)}
                  sx={{ borderRadius: 1 }}
                >
                  {isCreatingTask ? 'Traitement...' : dialogMode === 'addColumn' ? 'Créer' : dialogMode === 'editColumn' ? 'Modifier' : isEditing ? 'Mettre à jour la tâche' : 'Créer la tâche'}
                </StyledButton>
              )}
            </DialogActions>
          </StyledDialog>
        </Container>
      </Box>
    </KanbanContext.Provider>
  );
}

export default Kanban;