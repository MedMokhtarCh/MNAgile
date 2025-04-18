import React, { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Paper, Card, CardContent, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select as MuiSelect, OutlinedInput, useMediaQuery, useTheme, Grid, Container,
  Tooltip, Fade, AppBar, Toolbar, Autocomplete, InputAdornment, CircularProgress, Alert, Menu, MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PersonIcon from '@mui/icons-material/Person';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams } from 'react-router-dom';
import PageTitle from '../components/common/PageTitle';
import InputUserAssignment from '../components/common/InputUserAssignment';
import { useAvatar } from '../hooks/useAvatar';

// Styled components
const KanbanColumn = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  width: '320px',
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
    marginBottom: theme.spacing(2),
    borderRadius: 12,
    position: 'relative',
    borderLeft: `5px solid ${getPriorityColor(priority)}`,
    background: theme.palette.background.paper,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-3px)',
    },
  };
});

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
    fontSize: '0.75rem',
    height: 24,
    fontWeight: 500,
    '& .MuiChip-label': { padding: '0 10px' },
    '& .MuiChip-icon': { fontSize: '1rem', marginLeft: '6px' },
  };
});

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
  padding: theme.spacing(1, 2),
  fontWeight: 500,
}));

function SortableTask({ task, users }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { generateInitials, getAvatarColor } = useAvatar();

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
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" {...attributes} {...listeners} sx={{ mr: 1, p: 0.5, color: 'text.secondary', cursor: 'grab' }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>
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
            mb: 2,
            fontSize: '0.85rem',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {task.assignedUsers?.length > 0 ? (
              task.assignedUsers.map((email) => (
                <Tooltip key={email} title={getUserDisplayName(email)} placement="top">
                  <Chip
                    avatar={
                      <Avatar sx={{ bgcolor: getAvatarColor(getUserDisplayName(email)) }}>
                        {generateInitials(getUserDisplayName(email))}
                      </Avatar>
                    }
                    label={getUserDisplayName(email)}
                    size="small"
                    sx={{ borderRadius: 16 }}
                  />
                </Tooltip>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun utilisateur assigné
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
  const { generateInitials, getAvatarColor } = useAvatar();

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
  });
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

  const createNotification = (userEmail, taskTitle) => {
    try {
      const notification = {
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        type: 'task',
        sender: { name: 'Système', avatar: null },
        message: `Vous avez été assigné à la tâche "${taskTitle}" dans le projet "${projectTitle}".`,
        timestamp: new Date().toISOString(),
        read: false,
        recipient: userEmail,
      };
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      storedNotifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(storedNotifications));
      const event = new Event('newNotification');
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error creating notification:', err);
    }
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;
    try {
      const activeId = active.id;
      const overId = over.id;
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
      if (activeId !== overId && columns[sourceColumn].some((task) => task.id === overId)) {
        const destIndex = columns[sourceColumn].findIndex((task) => task.id === overId);
        if (destIndex !== -1) {
          const newColumnTasks = arrayMove(columns[sourceColumn], sourceIndex, destIndex);
          const newColumns = { ...columns, [sourceColumn]: newColumnTasks };
          updateColumns(newColumns);
          return;
        }
      }
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
      }
    } catch (err) {
      console.error('Error during drag-and-drop:', err);
      setError('Erreur lors du déplacement de la tâche.');
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
    });
    setDialogOpen(true);
    handleColumnMenuClose();
  };

  const handleFormChange = (field) => (event, value) => {
    try {
      if (field === 'assignedUsers') {
        setFormValues((prev) => ({ ...prev, [field]: value || [] }));
      } else {
        setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      }
    } catch (err) {
      console.error('Error handling form change:', err);
      setError('Erreur lors de la mise à jour du formulaire.');
    }
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
          createNotification(user.email, formValues.title);
        }
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Erreur lors de la création de la tâche.');
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
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="filter-user-label">Filtrer par utilisateur</InputLabel>
            <MuiSelect
              labelId="filter-user-label"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              input={<OutlinedInput label="Filtrer par utilisateur" />}
              sx={{ borderRadius: 2, bgcolor: 'white' }}
            >
              <MenuItem value="">Tous les utilisateurs</MenuItem>
              {projectUsers.map((user) => (
                <MenuItem key={user.email} value={user.email}>
                  {user.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }}>
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
                sx={{ width: 200, bgcolor: 'white' }}
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
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
          <Grid container spacing={2} sx={{ flexWrap: 'nowrap', overflowX: 'auto', pb: 2 }}>
            {columnOrder.map((columnId) => (
              <Grid item key={columnId}>
                <SortableContext
                  id={columnId}
                  items={filteredColumns[columnId]?.map((task) => task.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn id={columnId}>
                    <ColumnHeader>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          {columnLabels[columnId] || columnId.charAt(0).toUpperCase() + columnId.slice(1)}
                        </Typography>
                        <Chip
                          label={filteredColumns[columnId]?.length || 0}
                          size="small"
                          sx={{ height: 22, fontSize: '0.75rem', bgcolor: theme.palette.grey[200] }}
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
                    <Box sx={{ overflow: 'auto', flex: 1, maxHeight: 'calc(100vh - 250px)', p: 1 }}>
                      {filteredColumns[columnId]?.length === 0 ? (
                        <Box sx={{
                          p: 3,
                          textAlign: 'center',
                          color: theme.palette.text.secondary,
                          bgcolor: theme.palette.grey[100],
                          borderRadius: 8,
                          fontSize: '0.9rem',
                          minHeight: '100px',
                        }}>
                          Aucune tâche
                        </Box>
                      ) : (
                        filteredColumns[columnId].map((task) => (
                          <SortableTask key={task.id} task={task} users={users} />
                        ))
                      )}
                    </Box>
                  </KanbanColumn>
                </SortableContext>
              </Grid>
            ))}
          </Grid>
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
          maxWidth="sm"
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
            <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
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
                rows={5}
                value={formValues.description}
                onChange={handleFormChange('description')}
                sx={{ bgcolor: 'white' }}
              />
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