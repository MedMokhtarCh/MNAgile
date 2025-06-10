import React, { useState, useEffect, useMemo } from 'react';
import { Box, ThemeProvider, CircularProgress, Alert, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTasks, clearTasksError } from '../store/slices/taskSlice';
import { fetchBacklogs, clearBacklogsError } from '../store/slices/backlogSlice';
import { useAuth } from '../contexts/AuthContext';
import { theme, priorityColors, formatDate, months, weekdaysShort } from '../components/calendar/constants';
import Header from '../components/calendar/Header';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import TaskPopover from '../components/calendar/TaskPopover';
import TaskDetailsModal from '../components/calendar/TaskDetailsModal';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [taskPopover, setTaskPopover] = useState({ anchorEl: null, task: null });
  const [selectedTask, setSelectedTask] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { tasks, status: taskStatus, error: taskError } = useSelector((state) => state.tasks);
  const { backlogs, status: backlogStatus, error: backlogError } = useSelector((state) => state.backlogs);
  const { currentUser } = useAuth();
  const isValidProjectId = projectId && !isNaN(parseInt(projectId));

  // Fetch tasks and backlogs with retry mechanism
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const loadData = async () => {
      if (!isValidProjectId) {
        if (isMounted) {
          setLoading(false);
          dispatch(clearTasksError());
          dispatch(clearBacklogsError());
        }
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap(),
          dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap(),
        ]);
        if (isMounted) {
          setLoading(false);
          setRetryCount(0);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          if (retryCount < maxRetries && err.status !== 400) {
            retryTimeout = setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              loadData();
            }, 2000 * (retryCount + 1));
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [projectId, dispatch, retryCount, isValidProjectId]);

  // Map tasks to events with user-based filtering
  const events = useMemo(() => {
    return tasks
      .filter((task) => {
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

  const handleRetryFetch = () => {
    dispatch(clearTasksError());
    dispatch(clearBacklogsError());
    setLoading(true);
    setRetryCount(0);
    Promise.all([
      dispatch(fetchAllTasks({ projectId: parseInt(projectId) })),
      dispatch(fetchBacklogs({ projectId: parseInt(projectId) })),
    ]).finally(() => setLoading(false));
  };

  if (!isValidProjectId) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          ID du projet invalide. Veuillez vérifier l'URL et réessayer.
        </Alert>
      </Box>
    );
  }

  if (loading || taskStatus === 'loading' || backlogStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (taskError || backlogError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={handleRetryFetch}>Réessayer</Button>}
        >
          {taskError || backlogError === 'Failed to fetch tasks' || 'Failed to fetch backlogs'
            ? `Tentative de connexion au serveur... (${retryCount + 1}/${maxRetries})`
            : taskError || backlogError || 'Erreur lors du chargement des données.'}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, p: 2, minHeight: '100vh' }}>
        <Header
          currentDate={currentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          navigateToday={navigateToday}
          navigatePrevious={navigatePrevious}
          navigateNext={navigateNext}
          formatDate={formatDate}
          months={months}
        />
        {viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            selectedDay={selectedDay}
            setCurrentDate={setCurrentDate}
            setSelectedDay={setSelectedDay}
            events={events}
            handleOpenTaskPopover={setTaskPopover}
            weekdaysShort={weekdaysShort}
            theme={theme}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            selectedDay={selectedDay}
            setCurrentDate={setCurrentDate}
            setSelectedDay={setSelectedDay}
            events={events}
            handleOpenTaskPopover={setTaskPopover}
            weekdaysShort={weekdaysShort}
            months={months}
            formatDate={formatDate}
            theme={theme}
          />
        )}
        <TaskPopover
          taskPopover={taskPopover}
          handleCloseTaskPopover={() => setTaskPopover({ anchorEl: null, task: null })}
          handleOpenTaskDetails={setSelectedTask}
          formatDate={formatDate}
        />
        <TaskDetailsModal
          selectedTask={selectedTask}
          handleCloseTaskDetails={() => setSelectedTask(null)}
          formatDate={formatDate}
          backlogs={backlogs}
        />
      </Box>
    </ThemeProvider>
  );
};

export default Calendar;