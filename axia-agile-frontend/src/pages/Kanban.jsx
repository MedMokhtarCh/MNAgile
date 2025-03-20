import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Card, 
  CardContent, 
  Avatar, 
  AvatarGroup, 
  Menu, 
  MenuItem, 
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  OutlinedInput,
  useMediaQuery,
  useTheme,
  Grid,
  Container,
  Tooltip,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const KanbanColumn = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  padding: theme.spacing(2),
  width: '300px',
  minHeight: '500px',
  margin: theme.spacing(1),
  borderRadius: 12,
  boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.12)',
  },
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
}));

const TaskCard = styled(Card)(({ theme, priority }) => {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high':
        return theme.palette.error.light;
      case 'medium':
        return theme.palette.warning.light;
      case 'low':
        return theme.palette.success.light;
      default:
        return 'transparent';
    }
  };

  return {
    marginBottom: theme.spacing(2),
    borderRadius: 8,
    position: 'relative',
    borderLeft: `4px solid ${getPriorityColor(priority)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[3],
      transform: 'translateY(-2px)',
    },
  };
});

const PriorityChip = styled(Chip)(({ theme, priority }) => {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high':
        return {
          bg: theme.palette.error.light,
          color: theme.palette.error.contrastText
        };
      case 'medium':
        return {
          bg: theme.palette.warning.light,
          color: theme.palette.warning.contrastText
        };
      case 'low':
        return {
          bg: theme.palette.success.light,
          color: theme.palette.success.contrastText
        };
      default:
        return {
          bg: theme.palette.grey[300],
          color: theme.palette.text.primary
        };
    }
  };

  const colors = getPriorityColor(priority);
  
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontSize: '0.7rem',
    height: 20,
    '& .MuiChip-label': {
      padding: '0 8px',
    },
    '& .MuiChip-icon': {
      fontSize: '0.8rem',
      marginLeft: '5px',
    }
  };
});

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
}));

function SortableTask({ task, users }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const generateInitials = (email) => {
    const user = users.find(u => u.email === email);
    if (!user) return '?';
    
    const name = `${user.nom} `;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };
  const getAvatarColor = (email) => {
    const colors = ['#1E90FF', '#FFA500', '#FF69B4', '#32CD32', '#8B4513', '#9932CC', '#FF4500'];
    let sum = 0;
    for (let i = 0; i < email.length; i++) {
      sum += email.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };
  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  return (
    <TaskCard ref={setNodeRef} style={style} priority={task.priority}>
      <CardContent sx={{ pb: '8px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ mr: 1, p: 0, color: 'text.secondary', cursor: 'grab' }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
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
            fontSize: '0.8rem',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {task.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.8rem' } }}>
            {task.assignedUsers?.map((email, index) => (
              <Tooltip key={index} title={email} placement="top">
                <Avatar 
                  sx={{ 
                    bgcolor: getAvatarColor(email), 
                  }}
                >
                  {generateInitials(email)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          
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
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser')) || {};
    return user;
  });
  const [users, setUsers] = useState(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const storedAdmins = JSON.parse(localStorage.getItem('admins')) || [];
    return [...storedUsers, ...storedAdmins];
  });
  const [columns, setColumns] = useState(() => {
    const storedTasks = JSON.parse(localStorage.getItem('kanban_tasks')) || {
      todo: [],
      inProgress: [],
      done: [],
    };
    return storedTasks;
  });

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const getAssignedUsers = () => {
    const assignedUsers = new Set();
    Object.values(columns).forEach(tasks => {
      tasks.forEach(task => {
        task.assignedUsers.forEach(email => assignedUsers.add(email));
      });
    });
    return Array.from(assignedUsers).map(email => users.find(u => u.email === email)).filter(Boolean);
  };

  const assignedUsers = getAssignedUsers();

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumns = { ...columns, [newColumnName.toLowerCase().replace(/\s+/g, '')]: [] };
      setColumns(newColumns);
      localStorage.setItem('kanban_tasks', JSON.stringify(newColumns));
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };
  const filteredColumns = Object.keys(columns).reduce((acc, columnId) => {
    acc[columnId] = columns[columnId].filter(task => {
      const matchesUser = selectedUser ? task.assignedUsers.includes(selectedUser) : true;
      const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
      return matchesUser && matchesPriority;
    });
    return acc;
  }, {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    assignedUsers: [],
    priority: 'medium'
  });

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const columnLabels = {
    todo: "À faire",
    inProgress: "En cours",
    done: "Terminé"
  };
  useEffect(() => {
    setLoading(false);
  }, []);
  const handleDragEnd = (event) => {
    const { active, over } = event; 
    if (!active || !over) return;
    let sourceColumn = null;
    let sourceIndex = -1;
    Object.keys(columns).forEach(columnId => {
      const taskIndex = columns[columnId].findIndex(task => task.id === active.id);
      if (taskIndex !== -1) {
        sourceColumn = columnId;
        sourceIndex = taskIndex;
      }
    });
    
    if (sourceColumn === null) return;
    
    if (active.id !== over.id) {
      const destIndex = columns[sourceColumn].findIndex(task => task.id === over.id);
      
      if (destIndex !== -1) {
        const newColumnTasks = arrayMove(
          columns[sourceColumn], 
          sourceIndex, 
          destIndex
        );
        const newColumns = {
          ...columns,
          [sourceColumn]: newColumnTasks
        };
        
        setColumns(newColumns);
  
        localStorage.setItem('kanban_tasks', JSON.stringify(newColumns));
      }
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
      priority: 'medium'
    });
    setDialogOpen(true);
    handleColumnMenuClose();
  };
  const handleFormChange = (field) => (event) => {
    setFormValues({
      ...formValues,
      [field]: event.target.value
    });
  };
  const handleCreateTask = () => {
    if (!currentColumn) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: formValues.title,
      description: formValues.description,
      assignedUsers: formValues.assignedUsers,
      priority: formValues.priority,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email
    };
    const newColumns = {
      ...columns,
      [currentColumn]: [...columns[currentColumn], newTask]
    };
    
    setColumns(newColumns);
    localStorage.setItem('kanban_tasks', JSON.stringify(newColumns));
    setDialogOpen(false);
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tableau Kanban
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-user-label">Filtrer par utilisateur</InputLabel>
          <MuiSelect
            labelId="filter-user-label"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            input={<OutlinedInput label="Filtrer par utilisateur" />}
          >
            <MenuItem value="">Tous les utilisateurs</MenuItem>
            {assignedUsers.map((user) => (
              <MenuItem key={user.email} value={user.email}>
                {`${user.email} `}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-priority-label">Filtrer par priorité</InputLabel>
          <MuiSelect
            labelId="filter-priority-label"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            input={<OutlinedInput label="Filtrer par priorité" />}
          >
            <MenuItem value="">Toutes les priorités</MenuItem>
            <MenuItem value="high">Haute</MenuItem>
            <MenuItem value="medium">Moyenne</MenuItem>
            <MenuItem value="low">Basse</MenuItem>
          </MuiSelect>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {isAddingColumn ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Nom de la colonne"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <Button onClick={handleAddColumn} variant="contained" size="small">
              Ajouter
            </Button>
            <Button onClick={() => setIsAddingColumn(false)} variant="outlined" size="small">
              Annuler
            </Button>
          </Box>
        ) : (
          <Button onClick={() => setIsAddingColumn(true)} variant="outlined" startIcon={<AddIcon />}>
            Ajouter une colonne
          </Button>
        )}
      </Box>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
        <Grid container spacing={1} sx={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {Object.keys(filteredColumns).map((columnId) => (
            <Grid item key={columnId}>
              <SortableContext items={filteredColumns[columnId]} strategy={verticalListSortingStrategy}>
                <KanbanColumn>
                  <ColumnHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {columnLabels[columnId] || columnId}
                      </Typography>
                      <Chip 
                        label={filteredColumns[columnId].length} 
                        size="small" 
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Tooltip title={`Ajouter à ${columnLabels[columnId] || columnId}`} TransitionComponent={Fade} arrow>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleColumnMenuOpen(e, columnId)}
                        color="primary"
                        sx={{ 
                          backgroundColor: theme.palette.grey[100],
                          '&:hover': { backgroundColor: theme.palette.primary.light, color: 'white' }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ColumnHeader>
                  <Box sx={{ overflow: 'auto', flex: 1, maxHeight: 'calc(100vh - 200px)' }}>
                    {filteredColumns[columnId].length === 0 ? (
                      <Box sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        color: theme.palette.text.secondary,
                        backgroundColor: theme.palette.grey[100],
                        borderRadius: 1,
                        fontSize: '0.8rem'
                      }}>
                        Aucune tâche
                      </Box>
                    ) : (
                      filteredColumns[columnId].map(task => (
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
          sx: { borderRadius: 2 }
        }}
      >
        <MenuItem onClick={handleAddTask}>Ajouter une tâche</MenuItem>
      </Menu>
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Créer une nouvelle tâche dans {currentColumn ? columnLabels[currentColumn] || currentColumn : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <TextField
              label="Titre"
              variant="outlined"
              fullWidth
              required
              value={formValues.title}
              onChange={handleFormChange('title')}
              sx={{ mb: 3 }}
            />
            
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={formValues.description}
              onChange={handleFormChange('description')}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="task-priority-label">Priorité</InputLabel>
              <MuiSelect
                labelId="task-priority-label"
                value={formValues.priority}
                onChange={handleFormChange('priority')}
                input={<OutlinedInput label="Priorité" />}
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
            
            <FormControl fullWidth>
              <InputLabel id="assigned-users-label">Assigné à</InputLabel>
              <MuiSelect
                labelId="assigned-users-label"
                multiple
                value={formValues.assignedUsers}
                onChange={handleFormChange('assignedUsers')}
                input={<OutlinedInput label="Assigné à" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const user = users.find(u => u.email === value);
                      return (
                        <Chip 
                          key={value} 
                          label={user ? `${user.nom} ` : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {users.map((user) => (
                  <MenuItem key={user.email} value={user.email}>
                    {`${user.nom} (${user.email})`}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <StyledButton 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
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
  );
}

export default Kanban;