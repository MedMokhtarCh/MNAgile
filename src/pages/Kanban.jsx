// App.js
import React, { useState } from 'react';
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
 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



// Styled Components
const KanbanColumn = styled(Paper)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  padding: theme.spacing(2),
  width: 300,
  minHeight: 500,
  margin: theme.spacing(1),
  borderRadius: 8,
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const TaskCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const initialData = {
  todo: [
    { id: 'task-1', title: 'Hero section', description: 'Update hero section for mobile responsiveness.', users: ['#1E90FF', '#FFA500'] },
    { id: 'task-2', title: 'Typography change', description: 'Implement new typography system.', users: ['#FF69B4'] }
  ],
  inProgress: [
    { id: 'task-3', title: 'Implement design scraps', description: 'Convert Figma designs into React components.', users: ['#1E90FF', '#32CD32'] },
    { id: 'task-4', title: 'Fix bugs in CSS code', description: 'Address reported CSS issues in production.', users: ['#FF69B4', '#FFA500'] }
  ]
};

function SortableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskCard ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{task.title}</Typography>
          <IconButton size="small"><MoreHorizIcon fontSize="small" /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>{task.description}</Typography>
        <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
          {task.users.map((color, index) => (
            <Avatar key={index} sx={{ width: 24, height: 24, bgcolor: color, fontSize: '0.8rem' }} />
          ))}
        </AvatarGroup>
      </CardContent>
    </TaskCard>
  );
}

function Kanban() {
  const [todoTasks, setTodoTasks] = useState(initialData.todo);
  const [inProgressTasks, setInProgressTasks] = useState(initialData.inProgress);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTodoTasks((tasks) => {
        const oldIndex = tasks.findIndex(task => task.id === active.id);
        const newIndex = tasks.findIndex(task => task.id === over.id);
        return arrayMove(tasks, oldIndex, newIndex);
      });
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', p: 3, backgroundColor: '#fff', minHeight: '100vh' }}>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={todoTasks} strategy={verticalListSortingStrategy}>
          <KanbanColumn>
            <ColumnHeader>
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>To do</Typography>
              <IconButton size="small" onClick={handleMenuClick}><AddIcon fontSize="small" /></IconButton>
            </ColumnHeader>
            {todoTasks.map(task => <SortableTask key={task.id} task={task} />)}
          </KanbanColumn>
        </SortableContext>

        <SortableContext items={inProgressTasks} strategy={verticalListSortingStrategy}>
          <KanbanColumn>
            <ColumnHeader>
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>In Progress</Typography>
              <IconButton size="small" onClick={handleMenuClick}><AddIcon fontSize="small" /></IconButton>
            </ColumnHeader>
            {inProgressTasks.map(task => <SortableTask key={task.id} task={task} />)}
          </KanbanColumn>
        </SortableContext>
      </DndContext>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>Add Task</MenuItem>
        <MenuItem onClick={handleMenuClose}>Add Column</MenuItem>
      
      </Menu>
    
    
    </Box>
    
   
   
  );

 
}

export default Kanban;