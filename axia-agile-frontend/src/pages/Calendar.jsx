import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import TaskIcon from '@mui/icons-material/Task';
import EventIcon from '@mui/icons-material/Event';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachmentIcon from '@mui/icons-material/Attachment';
import SubtasksIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTasks, clearTasksError } from '../store/slices/taskSlice';
import { useAuth } from '../contexts/AuthContext';

// Custom Theme
const theme = createTheme({
  palette: {
    primary: { main: '#4d75f4' },
    secondary: { main: '#f6bc66' },
    success: { main: '#84c887' },
    error: { main: '#f67d74' },
    info: { main: '#50c1e9' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
          fontSize: '0.7rem',
        },
      },
    },
  },
});

// French localization constants
const weekdaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`;
};

// Priority colors
const priorityColors = {
  HIGH: 'error',
  MEDIUM: 'secondary',
  LOW: 'success',
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [taskPopover, setTaskPopover] = useState({ anchorEl: null, task: null });
  const [selectedTask, setSelectedTask] = useState(null); // For task details modal
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { tasks, status: taskStatus, error: taskError } = useSelector((state) => state.tasks);
  const { currentUser } = useAuth(); // Access authenticated user

  // Validate projectId
  const isValidProjectId = projectId && !isNaN(parseInt(projectId));

  // Fetch tasks with retry mechanism
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const loadTasks = async () => {
      if (!isValidProjectId) {
        if (isMounted) {
          setLoading(false);
          dispatch(clearTasksError());
        }
        return;
      }

      setLoading(true);
      try {
        await dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap();
        if (isMounted) {
          setLoading(false);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          if (retryCount < maxRetries && err.status !== 400) {
            retryTimeout = setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              loadTasks();
            }, 2000 * (retryCount + 1)); // Exponential backoff
          }
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [projectId, dispatch, retryCount, isValidProjectId]);

  // Map tasks to events with user-based filtering
  const events = useMemo(() => {
    return tasks
      .filter((task) => {
        // Filter tasks created by or assigned to the current user
        const isCreatedByUser = task.createdByUserId === currentUser.id;
        const isAssignedToUser = task.assignedUserIds?.includes(currentUser.id);
        return isCreatedByUser || isAssignedToUser;
      })
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        startDate: task.startDate ? new Date(task.startDate) : new Date(),
        endDate: task.endDate ? new Date(task.endDate) : new Date(),
        color: priorityColors[task.priority] || 'info',
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        backlogIds: task.backlogIds || [],
        sprintId: task.sprintId || null,
        subtasks: task.subtasks || [],
        attachments: task.attachments || [],
        metadata: task.metadata || {},
        originalTask: task,
      }));
  }, [tasks, currentUser.id]);

  // Utility functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isDateInRange = (date, startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const checkDate = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate >= start && checkDate <= end;
  };

  const isStartDate = (date, startDate) => {
    if (!startDate) return false;
    
    const start = new Date(startDate);
    const checkDate = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === start.getTime();
  };

  const isEndDate = (date, endDate) => {
    if (!endDate) return false;
    
    const end = new Date(endDate);
    const checkDate = new Date(date);
    
    end.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === end.getTime();
  };

  // Navigation functions
  const navigateToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  };

  const navigatePrevious = () => {
    const prevDate = new Date(currentDate);
    if (viewMode === 'month') {
      prevDate.setMonth(prevDate.getMonth() - 1);
    } else {
      prevDate.setDate(prevDate.getDate() - 7);
    }
    setCurrentDate(prevDate);
    setSelectedDay(prevDate.getDate());
  };

  const navigateNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
    }
    setCurrentDate(nextDate);
    setSelectedDay(nextDate.getDate());
  };

  // Generate dates for month view
  const getMonthDates = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const result = [];
    let currentWeek = [];

    const prevMonth = new Date(currentDate);
    prevMonth.setDate(0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      currentWeek.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i),
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      currentWeek.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: i === selectedDay && date.getMonth() === currentDate.getMonth(),
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      let dayCounter = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayCounter),
          day: dayCounter++,
          isCurrentMonth: false,
          isToday: false,
        });
      }
      result.push(currentWeek);
    }

    return result;
  };

  // Generate dates for week view
  const getWeekDates = () => {
    const result = [];
    const day = currentDate.getDay() || 7; // Convert Sunday (0) to 7
    const diff = currentDate.getDate() - day + 1; // Adjust to Monday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(diff);

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      result.push({
        date,
        day: date.getDate(),
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, currentDate),
      });
    }
    return result;
  };

  // Show task details in popover
  const handleOpenTaskPopover = (event, task) => {
    setTaskPopover({
      anchorEl: event.currentTarget,
      task,
    });
  };

  const handleCloseTaskPopover = () => {
    setTaskPopover({
      anchorEl: null,
      task: null,
    });
  };

  // Open task details modal
  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    handleCloseTaskPopover();
  };

  // Close task details modal
  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
  };

  // Render header
  const renderHeader = () => {
    const monthName = months[currentDate.getMonth()];
    let dateTitle;
    
    if (viewMode === 'month') {
      dateTitle = `${monthName} ${currentDate.getFullYear()}`;
    } else {
      const weekDates = getWeekDates();
      const startDate = formatDate(weekDates[0].date);
      const endDate = formatDate(weekDates[6].date);
      dateTitle = `${startDate} - ${endDate}`;
    }

    return (
      <Paper sx={{ p: 2, backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mr: 2 }}>
            {dateTitle}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" onClick={navigatePrevious} color="primary">
              <ChevronLeftIcon />
            </IconButton>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={navigateToday} 
              startIcon={<TodayIcon />}
              sx={{ mx: 1 }}
            >
              Aujourd'hui
            </Button>
            <IconButton size="small" onClick={navigateNext} color="primary">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('month')} 
              color={viewMode === 'month' ? 'primary' : 'default'}
              sx={{ borderRadius: '4px 0 0 4px' }}
            >
              <CalendarViewMonthIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('week')} 
              color={viewMode === 'week' ? 'primary' : 'default'}
              sx={{ borderRadius: '0 4px 4px 0' }}
            >
              <CalendarViewWeekIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthDates = getMonthDates();

    return (
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
          {weekdaysShort.map((day, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                p: 1,
                textAlign: 'center',
                color: 'text.secondary',
                fontWeight: 'medium',
                fontSize: '0.85rem',
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {monthDates.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: 'flex',
              borderBottom: weekIndex < monthDates.length - 1 ? '1px solid #eaeaea' : 'none',
            }}
          >
            {week.map((day, dayIndex) => (
              <Box
                key={dayIndex}
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderRight: dayIndex < week.length - 1 ? '1px solid #eaeaea' : 'none',
                  backgroundColor: day.isSelected ? '#f0f7ff' : day.isToday ? '#fafeff' : 'transparent',
                  opacity: day.isCurrentMonth ? 1 : 0.4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: day.isCurrentMonth ? '#f5f9ff' : 'transparent' },
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    setCurrentDate(new Date(day.date));
                    setSelectedDay(day.day);
                  }
                }}
              >
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: day.isToday ? 'primary.main' : 'transparent',
                      color: day.isToday ? 'white' : day.isSelected ? 'primary.main' : 'inherit',
                      fontWeight: day.isToday || day.isSelected ? 'bold' : 'normal',
                    }}
                  >
                    {day.day}
                  </Typography>
                </Box>
                <Box sx={{ px: 1, pb: 1, flexGrow: 1 }}>
                  {events
                    .filter((event) => isDateInRange(day.date, event.startDate, event.endDate))
                    .map((event) => {
                      const isStart = isStartDate(day.date, event.startDate);
                      const isEnd = isEndDate(day.date, event.endDate);
                      
                      return (
                        <Box
                          key={event.id}
                          sx={{
                            mb: 0.5,
                            borderRadius: '4px',
                            padding: '3px 6px',
                            backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main,
                            color: 'white',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            borderLeft: isStart ? `3px solid ${theme.palette.background.paper}` : 'none',
                            borderRight: isEnd ? `3px solid ${theme.palette.background.paper}` : 'none',
                            cursor: 'pointer',
                            opacity: event.status === 'COMPLETED' ? 0.7 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTaskPopover(e, event);
                          }}
                        >
                          <TaskIcon sx={{ fontSize: '12px', mr: 0.5 }} />
                          <Typography variant="caption" noWrap>{event.title}</Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Paper>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates();
    
    return (
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
          <Box sx={{ width: '60px' }}></Box>
          {weekDates.map((day, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '1px solid #eaeaea',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 'medium',
                  mb: 0.5
                }}
              >
                {weekdaysShort[i]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: day.isToday ? 'primary.main' : day.isSelected ? '#e3f2fd' : 'transparent',
                  color: day.isToday ? 'white' : day.isSelected ? 'primary.main' : 'inherit',
                  fontWeight: day.isToday || day.isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: day.isToday ? 'primary.dark' : '#e3f2fd' },
                }}
                onClick={() => {
                  setCurrentDate(new Date(day.date));
                  setSelectedDay(day.day);
                }}
              >
                {day.day}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
          {weekDates.map((day, dayIndex) => (
            <Box key={dayIndex}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  p: 1, 
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                }}
              >
                {day.date.getDate()} {months[day.date.getMonth()]}
              </Typography>
              <Box sx={{ p: 1 }}>
                {events
                  .filter((event) => isDateInRange(day.date, event.startDate, event.endDate))
                  .map((event) => (
                    <Box
                      key={event.id}
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: '4px',
                        backgroundColor: `${theme.palette[event.color].light}20`,
                        borderLeft: `4px solid ${theme.palette[event.color].main}`,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: `${theme.palette[event.color].light}40` },
                        opacity: event.status === 'COMPLETED' ? 0.7 : 1,
                      }}
                      onClick={(e) => handleOpenTaskPopover(e, event)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                          {event.title}
                        </Typography>
                        <Chip 
                          label={event.priority} 
                          size="small" 
                          color={event.color} 
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
                        <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                        <Typography variant="caption">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                {events.filter((event) => isDateInRange(day.date, event.startDate, event.endDate)).length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', py: 2 }}>
                    Aucune tâche pour ce jour
                  </Typography>
                )}
              </Box>
              {dayIndex < weekDates.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Render task popover
  const renderTaskPopover = () => {
    if (!taskPopover.task) return null;
    
    const { task } = taskPopover;
    const open = Boolean(taskPopover.anchorEl);
    const id = open ? 'task-popover' : undefined;

    return (
      <Popover
        id={id}
        open={open}
        anchorEl={taskPopover.anchorEl}
        onClose={handleCloseTaskPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mr: 2 }}>
              {task.title}
            </Typography>
            <Chip 
              label={task.priority} 
              size="small" 
              color={task.color}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          
          {task.description && (
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
              {task.description.length > 100 
                ? `${task.description.substring(0, 100)}...` 
                : task.description}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EventIcon color="action" sx={{ fontSize: '1rem', mr: 1 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                <strong>Début:</strong> {formatDate(task.startDate)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon color="action" sx={{ fontSize: '1rem', mr: 1 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                <strong>Fin:</strong> {formatDate(task.endDate)}
              </Typography>
            </Box>
          </Box>
          
          {task.assignedTo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                Assigné à:
              </Typography>
              <Chip 
                label={task.assignedTo} 
                size="small" 
                color="info" 
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => handleOpenTaskDetails(task)}
            >
              Détails
            </Button>
          </Box>
        </Box>
      </Popover>
    );
  };

  // Render task details modal
  const renderTaskDetailsModal = () => {
    if (!selectedTask) return null;

    return (
      <Dialog
        open={Boolean(selectedTask)}
        onClose={handleCloseTaskDetails}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2, p: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Détails de la tâche
          </Typography>
          <IconButton onClick={handleCloseTaskDetails}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{selectedTask.title}</Typography>
            <Chip
              label={selectedTask.priority}
              color={selectedTask.color}
              sx={{ mb: 1 }}
            />
            {selectedTask.status && (
              <Chip
                label={selectedTask.status}
                color="default"
                sx={{ ml: 1, mb: 1 }}
              />
            )}
          </Box>

          {selectedTask.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1">Description</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {selectedTask.description}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Dates</Typography>
            <Typography variant="body2">
              <strong>Début:</strong> {formatDate(selectedTask.startDate)}
            </Typography>
            <Typography variant="body2">
              <strong>Fin:</strong> {formatDate(selectedTask.endDate)}
            </Typography>
          </Box>

          {selectedTask.assignedTo && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Assigné à</Typography>
              <Chip label={selectedTask.assignedTo} color="info" />
            </>
          )}

          {selectedTask.backlogIds && selectedTask.backlogIds.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Backlogs</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTask.backlogIds.map((backlogId) => (
                  <Chip key={backlogId} label={`Backlog ${backlogId}`} color="secondary" />
                ))}
              </Box>
            </>
          )}

          {selectedTask.sprintId && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Sprint</Typography>
              <Chip label={`Sprint ${selectedTask.sprintId}`} color="primary" />
            </>
          )}

          {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SubtasksIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1">Sous-tâches</Typography>
              </Box>
              <List dense>
                {selectedTask.subtasks.map((subtask, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={subtask.title || `Sous-tâche ${index + 1}`}
                      secondary={subtask.completed ? 'Terminé' : 'En cours'}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {selectedTask.attachments && selectedTask.attachments.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1">Pièces jointes</Typography>
              </Box>
              <List dense>
                {selectedTask.attachments.map((attachment, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={attachment.name || `Pièce jointe ${index + 1}`}
                      secondary={
                        attachment.url ? (
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            Télécharger
                          </a>
                        ) : 'Non disponible'
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {selectedTask.metadata && Object.keys(selectedTask.metadata).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Métadonnées</Typography>
              <Typography variant="body2">
                <strong>Créé dans:</strong> {selectedTask.metadata.createdIn || 'Inconnu'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDetails} color="primary" variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Handle errors
  const handleRetryFetch = () => {
    dispatch(clearTasksError());
    setLoading(true);
    setRetryCount(0); // Reset retry count
    dispatch(fetchAllTasks({ projectId: parseInt(projectId) }))
      .unwrap()
      .finally(() => setLoading(false));
  };

  // Invalid projectId state
  if (!isValidProjectId) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          ID du projet invalide. Veuillez vérifier l'URL et réessayer.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading || taskStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (taskError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={handleRetryFetch}>Réessayer</Button>}
        >
          {taskError === 'Failed to fetch tasks' && retryCount < maxRetries
            ? `Tentative de connexion au serveur... (${retryCount + 1}/${maxRetries})`
            : taskError.includes('400')
            ? 'Requête invalide. Vérifiez l\'ID du projet .'
            : taskError || 'Erreur lors du chargement des tâches.'}
        </Alert>
      </Box>
    );
  }

  // Main render
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, p: 2, minHeight: '100vh' }}>
        {renderHeader()}
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        {renderTaskPopover()}
        {renderTaskDetailsModal()}
      </Box>
    </ThemeProvider>
  );
};

export default Calendar;