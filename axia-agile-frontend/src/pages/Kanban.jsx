import React, { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Paper, Card, CardContent, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select as MuiSelect, OutlinedInput, useMediaQuery, useTheme, Grid, Container,
  Tooltip, Fade, AppBar, Toolbar, Alert, Menu, MenuItem, CircularProgress, List, ListItem, ListItemText, Autocomplete,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams, useNavigate } from 'react-router-dom';
import PageTitle from '../components/common/PageTitle';
import InputUserAssignment from '../components/common/InputUserAssignment';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';

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
    switch (priority) {
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
    switch (priority) {
      case 'high': return { bg: theme.palette.error.light, color: theme.palette.error.contrastText };
      case 'medium': return { bg: theme.palette.warning.light, color: theme.palette.warning.contrastText };
      case 'low': return { bg: theme.palette.success.light, color: theme.palette.success.contrastText };
      default: return { bg: theme.palette.grey[300], color: theme.palette.text.primary };
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

function SortableColumn({ columnId, columns, columnLabels, filteredColumns, users, handleColumnMenuOpen }) {
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
            {columnLabels[columnId] || columnId.charAt(0).toUpperCase() + columnId.slice(1)}
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
            onClick={(e) => handleColumnMenuOpen(e, columnId)}
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
          filteredColumns[columnId].map((task) => (
            <SortableTask key={task.id} task={task} users={users} />
          ))
        )}
      </Box>
    </KanbanColumn>
  );
}

function SortableTask({ task, users }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const { generateInitials, getAvatarColor } = useAvatar();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? `${user.firstName} ${user.lastName}` : email;
  };

  return (
    <TaskCard ref={setNodeRef} style={style} priority={task.priority}>
      <CardContent sx={{ p: '8px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" {...attributes} {...listeners} sx={{ mr: 0.5, p: 0.3, color: 'text.secondary', cursor: 'grab' }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>
              {task.title}
            </Typography>
          </Box>
          <IconButton size="small">
            <MoreVertIcon fontSize="small" />
          </IconButton>
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
            {task.assignedUsers?.length > 0 ? (
              task.assignedUsers.map((email) => (
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
  const { generateInitials, getAvatarColor } = useAvatar();
  const { createNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [users, setUsers] = useState(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const storedAdmins = JSON.parse(localStorage.getItem('admins') || '[]');
    return [...storedUsers, ...storedAdmins].map((user) => ({
      id: user.id || '',
      name: `${user.nom || ''} ${user.prenom || ''}`.trim() || user.email,
      firstName: user.nom || '',
      lastName: user.prenom || '',
      email: user.email || '',
      company: user.company || '',
      role: user.role || '',
    }));
  });
  const [projectTitle, setProjectTitle] = useState(() => {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find((p) => p.id === projectId);
    return project?.title || `Projet ${projectId}`;
  });
  const [projectUsers, setProjectUsers] = useState([]);
  const [columns, setColumns] = useState(() => {
    const storedKanbans = JSON.parse(localStorage.getItem('kanban_tasks') || '{}');
    return storedKanbans[projectId] || { todo: [] };
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const storedKanbans = JSON.parse(localStorage.getItem('kanban_tasks') || '{}');
    return storedKanbans[projectId] ? Object.keys(storedKanbans[projectId]) : ['todo'];
  });
  const [activeId, setActiveId] = useState(null);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    assignedUsers: [],
    priority: 'medium',
    startDate: '',
    endDate: '',
    attachments: [],
    subtasks: [],
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const columnLabels = {
    todo: 'À faire',
    inProgress: 'En cours',
    done: 'Terminé',
  };

  // Fetch project-specific users
  useEffect(() => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const projectUserEmails = [
          ...(project.projectManagers || []),
          ...(project.productOwners || []),
          ...(project.scrumMasters || []),
          ...(project.users || []),
          ...(project.testers || []),
        ].filter((email, index, self) => self.indexOf(email) === index && email);
        const projectUsersData = users.filter((user) => projectUserEmails.includes(user.email));
        setProjectUsers(projectUsersData);
        if (projectUsersData.length === 0) {
          setError('Aucun utilisateur assigné à ce projet.');
        }
      } else {
        setError('Projet introuvable.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading project users:', err);
      setError('Erreur lors du chargement des utilisateurs.');
      setLoading(false);
    }
  }, [projectId, users]);

  // Handle task focus from URL parameters
  useEffect(() => {
    const handleTaskFocus = () => {
      const params = new URLSearchParams(window.location.search);
      const taskId = params.get('task');
      if (taskId) {
        console.log('Focus sur la tâche:', taskId);
      }
    };

    handleTaskFocus();
    window.addEventListener('popstate', handleTaskFocus);

    return () => {
      window.removeEventListener('popstate', handleTaskFocus);
    };
  }, []);

  const createTaskNotification = (userEmail, taskTitle, taskId) => {
    createNotification({
      recipient: userEmail,
      type: 'task',
      message: `Vous avez été assigné à la tâche "${taskTitle}" dans le projet "${projectTitle}".`,
      sender: {
        name: currentUser.name || currentUser.email,
        avatar: null,
      },
      metadata: {
        projectId,
        taskId,
      },
    });
  };

  const notifyTaskMove = (task, fromColumn, toColumn) => {
    const columnNames = {
      todo: 'À faire',
      inProgress: 'En cours',
      done: 'Terminé',
    };

    task.assignedUsers.forEach((email) => {
      if (email && email !== currentUser.email) {
        createNotification({
          recipient: email,
          type: 'task',
          message: `La tâche "${task.title}" a été déplacée de "${columnNames[fromColumn] || fromColumn}" à "${columnNames[toColumn] || toColumn}" dans le projet "${projectTitle}".`,
          sender: {
            name: currentUser.name || currentUser.email,
            avatar: null,
          },
          metadata: {
            projectId,
            taskId: task.id,
          },
        });
      }
    });
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    try {
      const columnId = newColumnName.toLowerCase().replace(/\s+/g, '');
      const newColumns = { ...columns, [columnId]: [] };
      const newColumnOrder = [...columnOrder, columnId];
      setColumns(newColumns);
      setColumnOrder(newColumnOrder);
      const storedKanbans = JSON.parse(localStorage.getItem('kanban_tasks') || '{}');
      storedKanbans[projectId] = newColumns;
      localStorage.setItem('kanban_tasks', JSON.stringify(storedKanbans));
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (err) {
      console.error('Error adding column:', err);
      setError('Erreur lors de l\'ajout de la colonne.');
    }
  };

  const filteredColumns = Object.keys(columns).reduce((acc, columnId) => {
    acc[columnId] = columns[columnId].filter((task) => {
      const matchesUser = selectedUser ? task.assignedUsers?.includes(selectedUser) : true;
      const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
      return matchesUser && matchesPriority;
    });
    return acc;
  }, {});

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
          const storedKanbans = JSON.parse(localStorage.getItem('kanban_tasks') || '{}');
          localStorage.setItem('kanban_tasks', JSON.stringify(storedKanbans));
        }
        return;
      }

      // Handle task reordering
      let sourceColumn = null;
      let sourceIndex = -1;
      Object.keys(columns).forEach((columnId) => {
        const taskIndex = columns[columnId].findIndex((task) => task.id === activeId);
        if (taskIndex !== -1) {
          sourceColumn = columnId;
          sourceIndex = taskIndex;
        }
      });

      if (!sourceColumn) return;

      // Same column reordering
      if (activeId !== overId && columns[sourceColumn].some((task) => task.id === overId)) {
        const destIndex = columns[sourceColumn].findIndex((task) => task.id === overId);
        if (destIndex !== -1) {
          const newColumnTasks = arrayMove(columns[sourceColumn], sourceIndex, destIndex);
          const newColumns = { ...columns, [sourceColumn]: newColumnTasks };
          updateColumns(newColumns);
          return;
        }
      }

      // Cross-column movement
      let destColumn = null;
      Object.keys(columns).forEach((columnId) => {
        if (columns[columnId].some((task) => task.id === overId) || overId === columnId) {
          destColumn = columnId;
        }
      });

      if (destColumn && destColumn !== sourceColumn) {
        const task = columns[sourceColumn][sourceIndex];
        const newSourceTasks = [...columns[sourceColumn]];
        newSourceTasks.splice(sourceIndex, 1);
        const newDestTasks = [...columns[destColumn]];
        const destIndex = columns[destColumn].findIndex((task) => task.id === overId);
        newDestTasks.splice(destIndex !== -1 ? destIndex : newDestTasks.length, 0, task);
        const newColumns = {
          ...columns,
          [sourceColumn]: newSourceTasks,
          [destColumn]: newDestTasks,
        };
        updateColumns(newColumns);
        notifyTaskMove(task, sourceColumn, destColumn);
      }
    } catch (err) {
      console.error('Error during drag-and-drop:', err);
      setError('Erreur lors du déplacement.');
    }
  };

  const updateColumns = (newColumns) => {
    try {
      setColumns(newColumns);
      const storedKanbans = JSON.parse(localStorage.getItem('kanban_tasks') || '{}');
      storedKanbans[projectId] = newColumns;
      localStorage.setItem('kanban_tasks', JSON.stringify(storedKanbans));
    } catch (err) {
      console.error('Error updating columns:', err);
      setError('Erreur lors de la mise à jour des tâches.');
    }
  };

  const handleColumnMenuOpen = (event, columnId) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentColumn(columnId);
  };

  const handleColumnMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAddTask = () => {
    setFormValues({
      title: '',
      description: '',
      assignedUsers: [],
      priority: 'medium',
      startDate: '',
      endDate: '',
      attachments: [],
      subtasks: [],
    });
    setNewSubtask('');
    setDialogOpen(true);
    handleColumnMenuClose();
  };

  const handleFormChange = (field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => ({ ...prev, [field]: value || [] }));
      } else if (field === 'attachments') {
        const files = Array.from(event.target.files);
        setFormValues((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...files.map(file => ({
            id: `file-${Date.now()}-${file.name}`,
            name: file.name,
            type: file.type,
            size: file.size,
          }))],
        }));
      } else {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      }
    } catch (err) {
      console.error('Error handling form change:', err);
      setError('Erreur lors de la mise à jour du formulaire.');
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormValues((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `subtask-${Date.now()}`, title: newSubtask, completed: false }],
    }));
    setNewSubtask('');
  };

  const handleRemoveSubtask = (subtaskId) => {
    setFormValues((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((subtask) => subtask.id !== subtaskId),
    }));
  };

  const handleRemoveAttachment = (attachmentId) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  };

  const handleCreateTask = () => {
    if (!currentColumn || !formValues.title) return;
    try {
      const newTask = {
        id: `task-${Date.now()}`,
        title: formValues.title,
        description: formValues.description,
        assignedUsers: formValues.assignedUsers.map((user) => user.email).filter(Boolean),
        priority: formValues.priority,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        attachments: formValues.attachments,
        subtasks: formValues.subtasks,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email || '',
      };
      const newColumns = {
        ...columns,
        [currentColumn]: [...columns[currentColumn], newTask],
      };
      updateColumns(newColumns);
      formValues.assignedUsers.forEach((user) => {
        if (user.email) {
          createTaskNotification(user.email, formValues.title, newTask.id);
        }
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Erreur lors de la création de la tâche.');
    }
  };

  const getActiveTask = () => {
    if (!activeId) return null;
    for (const columnId of Object.keys(columns)) {
      const task = columns[columnId].find((t) => t.id === activeId);
      if (task) return task;
    }
    return null;
  };

  const getActiveColumn = () => {
    if (!activeId) return null;
    if (columnOrder.includes(activeId)) {
      return { id: activeId };
    }
    return null;
  };

  const handleUserFilterChange = (event, value) => {
    setSelectedUser(value ? value.email : '');
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.grey[50] }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: `1px solid ${theme.palette.grey[200]}` }}>
        <Toolbar>
          <PageTitle>Tableau Kanban pour le projet {projectTitle}</PageTitle>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'center' }}>
          <Autocomplete
            options={[{ email: '', name: 'Tous les utilisateurs' }, ...projectUsers]}
            getOptionLabel={(option) =>
              option.email ? `${option.firstName} ${option.lastName} (${option.email})` : option.name
            }
            renderOption={(props, option) => (
              <li {...props}>
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
                      {option.firstName} {option.lastName} ({option.email})
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2">{option.name}</Typography>
                )}
              </li>
            )}
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
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="low">Basse</MenuItem>
            </MuiSelect>
          </FormControl>
          {isAddingColumn ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Nom de la colonne"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                sx={{ width: 180, bgcolor: 'white' }}
              />
              <StyledButton onClick={handleAddColumn} variant="contained">
                Ajouter
              </StyledButton>
              <StyledButton onClick={() => setIsAddingColumn(false)} variant="outlined">
                Annuler
              </StyledButton>
            </Box>
          ) : (
            <StyledButton onClick={() => setIsAddingColumn(true)} variant="outlined" startIcon={<AddIcon />}>
              Nouvelle colonne
            </StyledButton>
          )}
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
                  <SortableContext
                    id={columnId}
                    items={filteredColumns[columnId]?.map((task) => task.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <SortableColumn
                      columnId={columnId}
                      columns={columns}
                      columnLabels={columnLabels}
                      filteredColumns={filteredColumns}
                      users={users}
                      handleColumnMenuOpen={handleColumnMenuOpen}
                    />
                  </SortableContext>
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
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
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
                      {getActiveTask().assignedUsers?.length > 0 ? (
                        getActiveTask().assignedUsers.map((email) => (
                          <Tooltip key={email} title={users.find((u) => u.email === email)?.name || email} placement="top">
                            <Avatar
                              sx={{
                                bgcolor: getAvatarColor(users.find((u) => u.email === email)?.name || email),
                                width: 24,
                                height: 24,
                                fontSize: '0.7rem',
                              }}
                            >
                              {generateInitials(users.find((u) => u.email === email)?.name || email)}
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
                    {columnLabels[getActiveColumn().id] || getActiveColumn().id.charAt(0).toUpperCase() + getActiveColumn().id.slice(1)}
                  </Typography>
                </ColumnHeader>
              </KanbanColumn>
            ) : null}
          </DragOverlay>
        </DndContext>
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleColumnMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 200 },
          }}
        >
          <MenuItem onClick={handleAddTask} sx={{ py: 1.5, fontSize: '0.9rem' }}>
            Ajouter une tâche
          </MenuItem>
        </Menu>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: { borderRadius: 3, padding: 2, bgcolor: theme.palette.background.paper },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
            Nouvelle tâche dans {currentColumn ? (columnLabels[currentColumn] || currentColumn) : ''}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Titre"
                variant="outlined"
                fullWidth
                required
                value={formValues.title}
                onChange={handleFormChange('title')}
                sx={{ bgcolor: 'white' }}
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
                >
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FlagIcon sx={{ color: theme.palette.error.main, mr: 1 }} fontSize="small" />
                      Haute
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FlagIcon sx={{ color: theme.palette.warning.main, mr: 1 }} fontSize="small" />
                      Moyenne
                    </Box>
                  </MenuItem>
                  <MenuItem value="low">
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
                />
              ) : (
                <Typography color="text.secondary">
                  Aucun utilisateur disponible pour ce projet.
                </Typography>
              )}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Sous-tâches</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    placeholder="Nouvelle sous-tâche"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    fullWidth
                    sx={{ bgcolor: 'white' }}
                  />
                  <StyledButton onClick={handleAddSubtask} variant="contained" size="small">
                    Ajouter
                  </StyledButton>
                </Box>
                <List dense>
                  {formValues.subtasks.map((subtask) => (
                    <ListItem
                      key={subtask.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveSubtask(subtask.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={subtask.title} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Pièces jointes</Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                  sx={{ mb: 1 }}
                >
                  Ajouter un fichier
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFormChange('attachments')}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </Button>
                <List dense>
                  {formValues.attachments.map((attachment) => (
                    <ListItem
                      key={attachment.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveAttachment(attachment.id)}>
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
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <StyledButton
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              sx={{ bgcolor: 'white' }}
            >
              Annuler
            </StyledButton>
            <StyledButton
              onClick={handleCreateTask}
              variant="contained"
              disabled={!formValues.title}
            >
              Créer la tâche
            </StyledButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Kanban;