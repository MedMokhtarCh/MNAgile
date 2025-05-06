import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, Paper, Card, CardContent, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select as MuiSelect, OutlinedInput, useMediaQuery, useTheme, Grid, Container,
  Tooltip, Fade, AppBar, Toolbar, Alert, CircularProgress, List, ListItem, ListItemText, Autocomplete, MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageTitle from '../components/common/PageTitle';
import InputUserAssignment from '../components/common/InputUserAssignment';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { fetchAllTasks, createTask, updateTask, deleteTask, clearTasksError } from '../store/slices/taskSlice';
import { useAuth } from '../contexts/AuthContext';
import { projectApi } from '../services/api';

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

// Styled components
const KanbanColumn = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  width: '280px',
  minHeight: '600px',
  margin: theme.spacing(1),
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 25px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 2),
  background: theme.palette.grey[100],
  borderRadius: 8,
  cursor: 'move',
}));

const TaskCard = styled(Card)(({ theme, priority }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[400];
    }
  };

  return {
    marginBottom: theme.spacing(1.5),
    borderRadius: 10,
    position: 'relative',
    borderLeft: `4px solid ${getPriorityColor(priority)}`,
    background: theme.palette.background.paper,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
    },
    padding: theme.spacing(0.5),
    cursor: 'pointer',
  };
});

const EmptyTaskCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  borderRadius: 10,
  background: theme.palette.grey[100],
  padding: theme.spacing(1),
  textAlign: 'center',
  minHeight: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => {
  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return { bg: theme.palette.error.light, color: theme.palette.error.contrastText };
      case 'medium': return { bg: theme.palette.warning.light, color: theme.palette.warning.contrastText };
      case 'low': return { bg: theme.palette.success.light, color: theme.palette.success.contrastText };
      default: return { bg: theme.palette.grey[200], color: theme.palette.text.primary };
    }
  };

  const styles = getPriorityStyles(priority);
  return {
    backgroundColor: styles.bg,
    color: styles.color,
    fontSize: '0.7rem',
    height: 20,
    fontWeight: 500,
    '& .MuiChip-label': { padding: '0 8px' },
    '& .MuiChip-icon': { fontSize: '0.9rem', marginLeft: '5px' },
  };
});

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
  padding: theme.spacing(0.8, 1.8),
  fontWeight: 500,
}));

function SortableColumn({ columnId, columns, columnLabels, filteredColumns, users, handleAddTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: columnId });
  const theme = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <KanbanColumn ref={setNodeRef} style={style} id={columnId}>
      <ColumnHeader {...attributes} {...listeners}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'move' }} fontSize="small" />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {columnLabels[columnId] || columnId}
          </Typography>
          <Chip
            label={filteredColumns[columnId]?.length || 0}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', bgcolor: theme.palette.grey[200] }}
          />
        </Box>
        <Tooltip title={`Ajouter à ${columnLabels[columnId] || columnId}`} TransitionComponent={Fade} arrow>
          <IconButton
            size="small"
            onClick={() => handleAddTask(columnId)}
            sx={{
              bgcolor: theme.palette.primary.light,
              color: 'white',
              '&:hover': { bgcolor: theme.palette.primary.main },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ColumnHeader>
      <Box sx={{ flex: 1, maxHeight: 'calc(100vh - 250px)', p: 1 }}>
        {filteredColumns[columnId]?.length === 0 ? (
          <EmptyTaskCard>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Aucune tâche
            </Typography>
          </EmptyTaskCard>
        ) : (
          <SortableContext
            id={columnId}
            items={filteredColumns[columnId]?.map((task) => task.id.toString()) || []}
            strategy={verticalListSortingStrategy}
          >
            {filteredColumns[columnId].map((task) => (
              <SortableTask key={task.id} task={task} users={users} />
            ))}
          </SortableContext>
        )}
      </Box>
    </KanbanColumn>
  );
}

function SortableTask({ task, users }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString() });
  const { generateInitials, getAvatarColor } = useAvatar();
  const dispatch = useDispatch();
  const { setDialogOpen, setFormValues, setCurrentColumn, setIsEditing, setEditingTask, setDialogMode } = React.useContext(KanbanContext);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? `${user.firstName} ${user.lastName}`.trim() || email : email;
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    dispatch(deleteTask(task.id));
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    setIsEditing(true);
    setDialogMode('edit');
    setEditingTask(task);
    setCurrentColumn(task.status);
    setFormValues({
      title: task.title || '',
      description: task.description || '',
      assignedUsers: users.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
      priority: task.priority || 'Medium',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      attachments: [], // New attachments to be added
    });
    setDialogOpen(true);
  };

  const handleCardClick = () => {
    setIsEditing(false);
    setDialogMode('view');
    setEditingTask(task);
    setCurrentColumn(task.status);
    setFormValues({
      title: task.title || '',
      description: task.description || '',
      assignedUsers: users.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
      priority: task.priority || 'Medium',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      attachments: [], // No client-side attachments in view mode
    });
    setDialogOpen(true);
  };

  return (
    <TaskCard ref={setNodeRef} style={style} priority={task.priority} onClick={handleCardClick}>
      <CardContent sx={{ p: '8px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" {...attributes} {...listeners} sx={{ mr: 0.5, p: 0.3, color: 'text.secondary', cursor: 'grab' }} onClick={(e) => e.stopPropagation()}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>
              {task.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {task.attachments?.length > 0 && (
              <Tooltip title="Pièces jointes">
                <AttachFileIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              </Tooltip>
            )}
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontSize: '0.75rem',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {task.assignedUserEmails?.length > 0 ? (
              task.assignedUserEmails.map((email) => (
                <Tooltip key={email} title={getUserDisplayName(email)} placement="top">
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(getUserDisplayName(email)),
                      width: 24,
                      height: 24,
                      fontSize: '0.7rem',
                    }}
                  >
                    {generateInitials(getUserDisplayName(email))}
                  </Avatar>
                </Tooltip>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                Aucun
              </Typography>
            )}
          </Box>
          <PriorityChip
            priority={task.priority}
            icon={<FlagIcon />}
            label={getPriorityLabel(task.priority)}
            size="small"
          />
        </Box>
      </CardContent>
    </TaskCard>
  );
}

// Create context to share dialog state setters
const KanbanContext = React.createContext();

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

  // Redux state for tasks
  const { tasks, status: taskStatus, error: taskError } = useSelector((state) => state.tasks);

  // Local state
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kanbanError, setKanbanError] = useState('');
  const [columnOrder, setColumnOrder] = useState(['ToDo', 'InProgress', 'Done']);
  const [activeId, setActiveId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dialogMode, setDialogMode] = useState('view'); // 'view' or 'edit'
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    assignedUsers: [],
    priority: 'Medium',
    startDate: '',
    endDate: '',
    attachments: [],
  });

  const columnLabels = {
    ToDo: 'À faire',
    InProgress: 'En cours',
    Done: 'Terminé',
  };

  // Map tasks to columns
  const columns = {
    ToDo: tasks.filter((task) => task.status === 'ToDo' || !['InProgress', 'Done'].includes(task.status)),
    InProgress: tasks.filter((task) => task.status === 'InProgress'),
    Done: tasks.filter((task) => task.status === 'Done'),
  };

  // Filter tasks by user and priority
  const filteredColumns = Object.keys(columns).reduce((acc, columnId) => {
    acc[columnId] = columns[columnId].filter((task) => {
      const matchesUser = selectedUser ? task.assignedUserEmails?.includes(selectedUser) : true;
      const matchesPriority = selectedPriority ? task.priority.toLowerCase() === selectedPriority.toLowerCase() : true;
      return matchesUser && matchesPriority;
    });
    return acc;
  }, {});

  // Fetch project and tasks
  const loadData = useCallback(async () => {
    setLoading(true);
    setKanbanError('');
    try {
      const projectResponse = await projectApi.get(`/Projects/${projectId}`);
      const normalizedProject = normalizeProject(projectResponse.data);
      setProject(normalizedProject);

      await dispatch(fetchAllTasks()).unwrap();

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
      setLoading(false);
    } catch (err) {
      console.error('[Kanban] Error loading data:', err);
      if (err.response?.status === 401) {
        setKanbanError('Non autorisé. Veuillez vous reconnecter.');
        navigate('/login', { replace: true });
      } else if (err.response?.status === 404) {
        setKanbanError(`Le projet avec l'ID ${projectId} n'existe pas.`);
        navigate('/projects');
      } else {
        setKanbanError(`Erreur lors du chargement des données: ${err.message || JSON.stringify(err)}`);
      }
      setLoading(false);
    }
  }, [projectId, navigate, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Notify users of task movement
  const notifyTaskMove = (task, fromColumn, toColumn) => {
    const columnNames = {
      ToDo: 'À faire',
      InProgress: 'En cours',
      Done: 'Terminé',
    };
    task.assignedUserEmails.forEach((email) => {
      if (email && email !== currentUser.email) {
        createNotification({
          recipient: email,
          type: 'task',
          message: `La tâche "${task.title}" a été déplacée de "${columnNames[fromColumn]}" à "${columnNames[toColumn]}" dans le projet "${project?.title || 'Projet inconnu'}".`,
          sender: {
            name: currentUser.name || currentUser.email,
            avatar: null,
          },
          metadata: {
            taskId: task.id,
          },
        });
      }
    });
  };

  // Handle drag and drop
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!active || !over) return;

    try {
      const activeId = active.id;
      const overId = over.id;

      // Handle column reordering
      if (columnOrder.includes(activeId)) {
        const oldIndex = columnOrder.indexOf(activeId);
        const newIndex = columnOrder.indexOf(overId);
        if (oldIndex !== newIndex) {
          const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
          setColumnOrder(newColumnOrder);
        }
        return;
      }

      // Find source column and task
      let sourceColumn = null;
      let sourceIndex = -1;
      Object.keys(columns).forEach((columnId) => {
        const taskIndex = columns[columnId].findIndex((task) => task.id.toString() === activeId);
        if (taskIndex !== -1) {
          sourceColumn = columnId;
          sourceIndex = taskIndex;
        }
      });

      if (!sourceColumn) return;

      // Handle task reordering within the same column
      if (columns[sourceColumn].some((task) => task.id.toString() === overId)) {
        const destIndex = columns[sourceColumn].findIndex((task) => task.id.toString() === overId);
        if (destIndex !== -1 && sourceIndex !== destIndex) {
          const newTasks = [...tasks];
          const columnTasks = newTasks.filter((task) => columns[sourceColumn].some(t => t.id === task.id));
          const otherTasks = newTasks.filter((task) => !columns[sourceColumn].some(t => t.id === task.id));
          const reorderedColumnTasks = arrayMove(columnTasks, sourceIndex, destIndex);
          const updatedTasks = [...otherTasks, ...reorderedColumnTasks];
          dispatch({
            type: 'tasks/setTasks',
            payload: updatedTasks,
          });
        }
        return;
      }

      // Handle task moving to a different column
      let destColumn = null;
      Object.keys(columns).forEach((columnId) => {
        if (columns[columnId].some((task) => task.id.toString() === overId) || overId === columnId) {
          destColumn = columnId;
        }
      });

      if (destColumn && destColumn !== sourceColumn) {
        const task = columns[sourceColumn][sourceIndex];
        dispatch(updateTask({
          taskId: task.id,
          taskData: {
            ...task,
            status: destColumn,
            projectId,
          },
          attachments: [],
        }));
        notifyTaskMove(task, sourceColumn, destColumn);
      }
    } catch (err) {
      console.error('[Kanban] Error during drag-and-drop:', err);
      setKanbanError('Erreur lors du déplacement.');
    }
  };

  // Handle task creation dialog
  const handleAddTask = (columnId) => {
    setCurrentColumn(columnId);
    setIsEditing(false);
    setDialogMode('edit');
    setEditingTask(null);
    setFormValues({
      title: '',
      description: '',
      assignedUsers: [],
      priority: 'Medium',
      startDate: '',
      endDate: '',
      attachments: [],
    });
    setDialogOpen(true);
  };

  // Handle form changes
  const handleFormChange = (field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => ({ ...prev, [field]: value || [] }));
      } else if (field === 'attachments') {
        const files = Array.from(event.target.files);
        setFormValues((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...files],
        }));
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
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Create task
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
        assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
        priority: formValues.priority,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        status: currentColumn,
        projectId,
      };

      const result = await dispatch(createTask({ taskData, attachments: formValues.attachments })).unwrap();

      // Update Redux tasks state
      dispatch({
        type: 'tasks/addTask',
        payload: { ...result, attachments: result.attachments || [] },
      });

      // Send notifications
      formValues.assignedUsers.forEach((user) => {
        if (user.email) {
          createTaskNotification(user.email, formValues.title, result.id);
        }
      });

      // Update formValues with server-side data
      setFormValues({
        title: result.title || '',
        description: result.description || '',
        assignedUsers: projectUsers.filter((u) => result.assignedUserEmails?.includes(u.email)) || [],
        priority: result.priority || 'Medium',
        startDate: parseDate(result.startDate),
        endDate: parseDate(result.endDate),
        attachments: formValues.attachments, // Preserve client-side attachments
      });

      // Update editingTask with server-side data
      setEditingTask({
        ...result,
        attachments: result.attachments || [],
      });

      setDialogMode('view');
      setIsEditing(false);
      // Keep dialog open to show created task
    } catch (err) {
      console.error('[Kanban] Error creating task:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
        stack: err.stack,
      });
      setKanbanError(`Erreur lors de la création de la tâche: ${err.message || 'Erreur inconnue. Veuillez vérifier les données et réessayer.'}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Update task
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
        assignedUserEmails: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
        priority: formValues.priority,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        status: currentColumn,
        projectId,
      };

      const result = await dispatch(updateTask({
        taskId: editingTask.id,
        taskData,
        attachments: formValues.attachments,
      })).unwrap();

      // Update notifications
      formValues.assignedUsers.forEach((user) => {
        if (user.email) {
          updateTaskNotification(user.email, formValues.title, result.id);
        }
      });

      // Update formValues with server-side data
      setFormValues({
        title: result.title || '',
        description: result.description || '',
        assignedUsers: projectUsers.filter((u) => result.assignedUserEmails?.includes(u.email)) || [],
        priority: result.priority || 'Medium',
        startDate: parseDate(result.startDate),
        endDate: parseDate(result.endDate),
        attachments: [],
      });

      // Update editingTask with server-side data
      setEditingTask({
        ...result,
        attachments: result.attachments || [],
      });

      setDialogMode('view');
      setIsEditing(false);
    } catch (err) {
      console.error('[Kanban] Error updating task:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
        stack: err.stack,
      });
      setKanbanError(`Erreur lors de la mise à jour de la tâche: ${err.message || 'Erreur inconnue. Veuillez vérifier les données et réessayer.'}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Get active task for drag overlay
  const getActiveTask = () => {
    if (!activeId) return null;
    for (const columnId of Object.keys(columns)) {
      const task = columns[columnId].find((t) => t.id.toString() === activeId);
      if (task) return task;
    }
    return null;
  };

  // Get active column for drag overlay
  const getActiveColumn = () => {
    if (!activeId) return null;
    if (columnOrder.includes(activeId)) {
      return { id: activeId };
    }
    return null;
  };

  // Handle user filter
  const handleUserFilterChange = (event, value) => {
    setSelectedUser(value ? value.email : '');
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
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
        <Alert severity="error">{kanbanError || 'Projet introuvable.'}</Alert>
      </Container>
    );
  }

  return (
    <KanbanContext.Provider value={{ setDialogOpen, setFormValues, setCurrentColumn, setIsEditing, setEditingTask, setDialogMode }}>
      <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.grey[50] }}>
        <AppBar position="static" sx={{ bgcolor: 'white', borderBottom: `1px solid ${theme.palette.grey[200]}` }}>
          <Toolbar>
            <PageTitle>Tableau Kanban pour le projet {project.title}</PageTitle>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
          {(kanbanError || taskError) && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={handleRetryFetch}>
                  Réessayer
                </Button>
              }
            >
              {kanbanError || taskError}
            </Alert>
          )}
          {taskStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={40} />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'center' }}>
            <Autocomplete
              options={[{ email: '', name: 'Tous les utilisateurs' }, ...projectUsers]}
              getOptionLabel={(option) =>
                option.email ? `${option.firstName} ${option.lastName} (${option.email})` : option.name
              }
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    {option.email ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(option.name),
                            width: 24,
                            height: 24,
                            fontSize: '0.7rem',
                          }}
                        >
                          {generateInitials(option.name)}
                        </Avatar>
                        <Typography variant="body2">
                          {option.firstName} ${option.lastName} (${option.email})
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">{option.name}</Typography>
                    )}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrer par utilisateur"
                  variant="outlined"
                  sx={{ minWidth: 300, bgcolor: 'white' }}
                />
              )}
              value={projectUsers.find((user) => user.email === selectedUser) || { email: '', name: 'Tous les utilisateurs' }}
              onChange={handleUserFilterChange}
              isOptionEqualToValue={(option, value) => option.email === value.email}
              sx={{ minWidth: 200 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="filter-priority-label">Filtrer par priorité</InputLabel>
              <MuiSelect
                labelId="filter-priority-label"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                input={<OutlinedInput label="Filtrer par priorité" />}
                sx={{ borderRadius: 2, bgcolor: 'white' }}
              >
                <MenuItem value="">Toutes les priorités</MenuItem>
                <MenuItem value="High">Haute</MenuItem>
                <MenuItem value="Medium">Moyenne</MenuItem>
                <MenuItem value="Low">Basse</MenuItem>
              </MuiSelect>
            </FormControl>
          </Box>
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              <Grid container spacing={2} sx={{ flexWrap: 'nowrap', overflowX: 'auto', pb: 2 }}>
                {columnOrder.map((columnId) => (
                  <Grid item key={columnId}>
                    <SortableColumn
                      columnId={columnId}
                      columns={columns}
                      columnLabels={columnLabels}
                      filteredColumns={filteredColumns}
                      users={projectUsers}
                      handleAddTask={handleAddTask}
                    />
                  </Grid>
                ))}
              </Grid>
            </SortableContext>
            <DragOverlay>
              {getActiveTask() ? (
                <TaskCard
                  priority={getActiveTask().priority}
                  sx={{ cursor: 'grabbing', boxShadow: theme.shadows[8] }}
                >
                  <CardContent sx={{ p: '8px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>
                        {getActiveTask().title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getActiveTask().attachments?.length > 0 && (
                          <AttachFileIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        )}
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontSize: '0.75rem',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {getActiveTask().description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getActiveTask().assignedUserEmails?.length > 0 ? (
                          getActiveTask().assignedUserEmails.map((email) => (
                            <Tooltip key={email} title={projectUsers.find((u) => u.email === email)?.name || email} placement="top">
                              <Avatar
                                sx={{
                                  bgcolor: getAvatarColor(projectUsers.find((u) => u.email === email)?.name || email),
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.7rem',
                                }}
                              >
                                {generateInitials(projectUsers.find((u) => u.email === email)?.name || email)}
                              </Avatar>
                            </Tooltip>
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Aucun
                          </Typography>
                        )}
                      </Box>
                      <PriorityChip
                        priority={getActiveTask().priority}
                        icon={<FlagIcon />}
                        label={getPriorityLabel(getActiveTask().priority)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </TaskCard>
              ) : getActiveColumn() ? (
                <KanbanColumn sx={{ opacity: 0.8, boxShadow: theme.shadows[8] }}>
                  <ColumnHeader>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {columnLabels[getActiveColumn().id] || getActiveColumn().id}
                    </Typography>
                  </ColumnHeader>
                </KanbanColumn>
              ) : null}
            </DragOverlay>
          </DndContext>
          <Dialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setIsEditing(false);
              setEditingTask(null);
              setDialogMode('view');
              setFormValues({
                title: '',
                description: '',
                assignedUsers: [],
                priority: 'Medium',
                startDate: '',
                endDate: '',
                attachments: [],
              });
            }}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { borderRadius: 3, padding: 2, bgcolor: theme.palette.background.paper },
            }}
          >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {dialogMode === 'view' ? `Détails de la tâche: ${editingTask?.title || ''}` : isEditing ? `Modifier la tâche: ${editingTask?.title || ''}` : `Nouvelle tâche dans ${currentColumn ? (columnLabels[currentColumn] || currentColumn) : 'Non spécifié'}`}
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
                {dialogMode === 'view' ? (
                  <>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Titre</Typography>
                      <Typography variant="body1">{formValues.title || 'Non défini'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
                      <Typography variant="body1">{formValues.description || 'Aucune description'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Date de début</Typography>
                        <Typography variant="body1">{formValues.startDate || 'Non définie'}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Date de fin</Typography>
                        <Typography variant="body1">{formValues.endDate || 'Non définie'}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Priorité</Typography>
                      <Typography variant="body1">{getPriorityLabel(formValues.priority)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigné à</Typography>
                      {formValues.assignedUsers.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {formValues.assignedUsers.map((user) => (
                            <Chip
                              key={user.email}
                              avatar={
                                <Avatar sx={{ bgcolor: getAvatarColor(user.name) }}>
                                  {generateInitials(user.name)}
                                </Avatar>
                              }
                              label={`${user.firstName} ${user.lastName} (${user.email})`}
                              size="small"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body1">Aucun utilisateur assigné</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Pièces jointes</Typography>
                      {editingTask?.attachments?.length > 0 ? (
                        <List dense>
                          {editingTask.attachments.map((attachment, index) => (
                            <ListItem key={`server-attachment-${index}`}>
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
                  </>
                ) : (
                  <>
                    <TextField
                      label="Titre"
                      variant="outlined"
                      fullWidth
                      required
                      value={formValues.title}
                      onChange={handleFormChange('title')}
                      sx={{ bgcolor: 'white' }}
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
                      sx={{ bgcolor: 'white' }}
                      disabled={isCreatingTask}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Date de début"
                        type="date"
                        variant="outlined"
                        fullWidth
                        value={formValues.startDate}
                        onChange={handleFormChange('startDate')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'white' }}
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
                        sx={{ bgcolor: 'white' }}
                        disabled={isCreatingTask}
                      />
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel id="task-priority-label">Priorité</InputLabel>
                      <MuiSelect
                        labelId="task-priority-label"
                        value={formValues.priority}
                        onChange={handleFormChange('priority')}
                        input={<OutlinedInput label="Priorité" />}
                        sx={{ bgcolor: 'white' }}
                        disabled={isCreatingTask}
                      >
                        <MenuItem value="High">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FlagIcon sx={{ color: theme.palette.error.main, mr: 1 }} fontSize="small" />
                            Haute
                          </Box>
                        </MenuItem>
                        <MenuItem value="Medium">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FlagIcon sx={{ color: theme.palette.warning.main, mr: 1 }} fontSize="small" />
                            Moyenne
                          </Box>
                        </MenuItem>
                        <MenuItem value="Low">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FlagIcon sx={{ color: theme.palette.success.main, mr: 1 }} fontSize="small" />
                            Basse
                          </Box>
                        </MenuItem>
                      </MuiSelect>
                    </FormControl>
                    {projectUsers.length > 0 ? (
                      <InputUserAssignment
                        options={projectUsers}
                        value={formValues.assignedUsers}
                        onChange={handleFormChange('assignedUsers')}
                        label="Assigné à"
                        placeholder="Sélectionner les utilisateurs"
                        getAvatarColor={getAvatarColor}
                        generateInitials={generateInitials}
                        disabled={isCreatingTask}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        Aucun utilisateur disponible pour ce projet.
                      </Typography>
                    )}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Pièces jointes</Typography>
                      {editingTask?.attachments?.length > 0 && (
                        <List dense>
                          {editingTask.attachments.map((attachment, index) => (
                            <ListItem key={`server-attachment-${index}`}>
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
                        sx={{ mb: 1 }}
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
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
              <StyledButton
                onClick={() => {
                  setDialogOpen(false);
                  setIsEditing(false);
                  setEditingTask(null);
                  setDialogMode('view');
                  setFormValues({
                    title: '',
                    description: '',
                    assignedUsers: [],
                    priority: 'Medium',
                    startDate: '',
                    endDate: '',
                    attachments: [],
                  });
                  setKanbanError('');
                }}
                variant="outlined"
                sx={{ bgcolor: 'white' }}
                disabled={isCreatingTask}
              >
                {dialogMode === 'view' ? 'Fermer' : 'Annuler'}
              </StyledButton>
              {dialogMode === 'edit' && (
                <StyledButton
                  onClick={isEditing ? handleUpdateTask : handleCreateTask}
                  variant="contained"
                  disabled={!formValues.title || !currentColumn || !projectId || isCreatingTask}
                >
                  {isCreatingTask ? 'Traitement...' : isEditing ? 'Mettre à jour la tâche' : 'Créer la tâche'}
                </StyledButton>
              )}
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </KanbanContext.Provider>
  );
}

export default Kanban;