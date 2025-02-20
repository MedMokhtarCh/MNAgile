// BacklogPage.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Pagination,
  Tab,
  Tabs,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  border: '1px dashed #ccc',
  borderRadius: 8,
  marginBottom: theme.spacing(2),
}));

const TaskItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  marginBottom: theme.spacing(1),
  backgroundColor: '#fff',
}));

const AddButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: '#0066cc',
  borderColor: '#e0e0e0',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
}));

function BacklogPage() {
  const [backlogs, setBacklogs] = useState([
    { id: 1, title: 'tache 1', checked: true },
    { id: 2, title: 'tache 2', checked: false },
  ]);

  const [sprintTasks, setSprintTasks] = useState([
    { id: 1, title: 'tache 1', checked: false },
    { id: 2, title: 'tache 2', checked: false },
  ]);

  const [tabValue, setTabValue] = useState('active');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBacklogCheck = (id) => {
    setBacklogs(backlogs.map(task => 
      task.id === id ? { ...task, checked: !task.checked } : task
    ));
  };

  const handleSprintCheck = (id) => {
    setSprintTasks(sprintTasks.map(task => 
      task.id === id ? { ...task, checked: !task.checked } : task
    ));
  };

  return (
    <Box sx={{ p: 3, display: 'flex', gap: 3 }}>
      {/* Backlog Section */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>backlog</Typography>
        
        <StyledPaper elevation={0}>
          <AddButton
            startIcon={<AddIcon />}
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
          >
            AJOUTER BACKLOG
          </AddButton>

          {backlogs.map((task) => (
            <TaskItem key={task.id}>
              <Checkbox
                checked={task.checked}
                onChange={() => handleBacklogCheck(task.id)}
                sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
              />
              <Typography>{task.title}</Typography>
              <IconButton size="small" sx={{ ml: 'auto' }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </TaskItem>
          ))}
        </StyledPaper>
      </Box>

      {/* Sprint Section */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <AddButton
            startIcon={<AddIcon />}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            AJOUTER SPRINT
          </AddButton>
        </Box>

        <StyledPaper elevation={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Sprint 1</Typography>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', minWidth: 'auto' },
                mb: 2
              }}
            >
              <Tab label="Active" value="active" />
              <Tab label="Inactive" value="inactive" />
            </Tabs>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {sprintTasks.map((task) => (
            <Box 
              key={task.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1 
              }}
            >
              <Checkbox
                checked={task.checked}
                onChange={() => handleSprintCheck(task.id)}
                sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
              />
              <Typography>{task.title}</Typography>
            </Box>
          ))}
        </StyledPaper>
      </Box>

    
    </Box>
  );
}

export default BacklogPage;