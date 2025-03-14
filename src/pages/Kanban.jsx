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

// Styled Components
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

  // Generate avatar with initials
  const generateInitials = (email) => {
    const user = users.find(u => u.email === email);
    if (!user) return '?';
    
    const name = `${user.firstName} ${user.lastName}`;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Get background color for avatar based on email
  const getAvatarColor = (email) => {
    const colors = ['#1E90FF', '#FFA500', '#FF69B4', '#32CD32', '#8B4513', '#9932CC', '#FF4500'];
    let sum = 0;
    for (let i = 0; i < email.length; i++) {
      sum += email.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Get priority label
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
  
  // Use sensors to improve drag and drop experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example'
  });
  const [users, setUsers] = useState([
    { email: 'user@example.com', firstName: 'User', lastName: 'Example' },
    { email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    { email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' }
  ]);
  
  // Kanban columns
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: []
  });
  
  // Task creation modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    assignedUsers: [],
    priority: 'medium'
  });
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // Column labels mapping
  const columnLabels = {
    todo: "À faire",
    inProgress: "En cours"
  };

  // Load tasks data on component mount
  useEffect(() => {
    // Simulate loading stored tasks
    setTimeout(() => {
      // Mock data
      const mockTasks = {
        todo: [
          {
            id: 'task-1',
            title: 'Concevoir l\'interface utilisateur',
            description: 'Créer des maquettes pour l\'interface principale',
            assignedUsers: ['user@example.com'],
            priority: 'high',
            createdAt: new Date().toISOString(),
            createdBy: 'user@example.com'
          },
          {
            id: 'task-2',
            title: 'Configurer l\'environnement de développement',
            description: 'Installer et configurer tous les outils nécessaires',
            assignedUsers: ['jane@example.com'],
            priority: 'medium',
            createdAt: new Date().toISOString(),
            createdBy: 'user@example.com'
          }
        ],
        inProgress: [
          {
            id: 'task-3',
            title: 'Implémenter l\'authentification',
            description: 'Mettre en place le système de connexion et d\'inscription',
            assignedUsers: ['john@example.com', 'user@example.com'],
            priority: 'high',
            createdAt: new Date().toISOString(),
            createdBy: 'john@example.com'
          }
        ]
      };
      
      setColumns(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!active || !over) return;
    
    // Find the source and destination columns
    let sourceColumn = null;
    let sourceIndex = -1;
    
    // Find which column and index the dragged item is from
    Object.keys(columns).forEach(columnId => {
      const taskIndex = columns[columnId].findIndex(task => task.id === active.id);
      if (taskIndex !== -1) {
        sourceColumn = columnId;
        sourceIndex = taskIndex;
      }
    });
    
    if (sourceColumn === null) return;
    
    // If we're dragging within the same column
    if (active.id !== over.id) {
      const destIndex = columns[sourceColumn].findIndex(task => task.id === over.id);
      
      if (destIndex !== -1) {
        // Create a new array with the new order
        const newColumnTasks = arrayMove(
          columns[sourceColumn], 
          sourceIndex, 
          destIndex
        );
        
        // Update the columns state
        const newColumns = {
          ...columns,
          [sourceColumn]: newColumnTasks
        };
        
        setColumns(newColumns);
        
        // Save to localStorage (optional)
        localStorage.setItem('kanban_tasks', JSON.stringify(newColumns));
      }
    }
  };

  // Handle column menu open
  const handleColumnMenuOpen = (event, columnId) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentColumn(columnId);
  };

  // Handle column menu close
  const handleColumnMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Open the add task dialog
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

  // Handle form field changes
  const handleFormChange = (field) => (event) => {
    setFormValues({
      ...formValues,
      [field]: event.target.value
    });
  };

  // Create a new task
  const handleCreateTask = () => {
    if (!currentColumn) return;
    
    // Create a new task
    const newTask = {
      id: `task-${Date.now()}`,
      title: formValues.title,
      description: formValues.description,
      assignedUsers: formValues.assignedUsers,
      priority: formValues.priority,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email
    };
    
    // Add the task to the column
    const newColumns = {
      ...columns,
      [currentColumn]: [...columns[currentColumn], newTask]
    };
    
    setColumns(newColumns);
    
    // Save to localStorage (optional)
    localStorage.setItem('kanban_tasks', JSON.stringify(newColumns));
    
    // Close the dialog
    setDialogOpen(false);
  };

  // If loading
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

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
        <Grid container spacing={1} sx={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {Object.keys(columns).map((columnId) => (
            <Grid item key={columnId}>
              <SortableContext items={columns[columnId]} strategy={verticalListSortingStrategy}>
                <KanbanColumn>
                  <ColumnHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {columnLabels[columnId]}
                      </Typography>
                      <Chip 
                        label={columns[columnId].length} 
                        size="small" 
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Tooltip title={`Ajouter à ${columnLabels[columnId]}`} TransitionComponent={Fade} arrow>
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
                    {columns[columnId].length === 0 ? (
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
                      columns[columnId].map(task => (
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

      {/* Column Menu */}
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

      {/* Add Task Dialog */}
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
          Créer une nouvelle tâche dans {currentColumn ? columnLabels[currentColumn] : ''}
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
                          label={user ? `${user.firstName} ${user.lastName}` : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {users.map((user) => (
                  <MenuItem key={user.email} value={user.email}>
                    {`${user.firstName} ${user.lastName} (${user.email})`}
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