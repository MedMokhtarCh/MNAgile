import React, { useState, useEffect, useCallback, createContext, useMemo } from 'react';
import {
  Box, Typography, Paper, useMediaQuery, useTheme, Grid, Container, Alert, CircularProgress, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanCard from '../components/kanban/KanbanCard';
import KanbanFilters from '../components/kanban/KanbanFilters';
import { TaskDialog } from '../components/kanban/TaskDialog';
import { DeleteColumnDialog } from '../components/kanban/DeleteColumnDialog';
import { useAvatar } from '../hooks/useAvatar';
import { useNotification } from '../hooks/useNotifications';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTask } from '../hooks/useTask';
import { fetchKanbanColumns, createKanbanColumn, updateKanbanColumn, deleteKanbanColumn } from '../store/slices/kanbanColumnSlice';
import { fetchBacklogs } from '../store/slices/backlogSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { useAuth } from '../contexts/AuthContext';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';
import PageTitle from '../components/common/PageTitle';
import { fetchSprints, clearSprintsError } from '../store/slices/sprintSlice';
import { StyledButton } from '../components/kanban/theme';
import { normalizePriority } from '../utils/normalize';

export const KanbanContext = createContext();

// Define input selectors
const selectTasksState = (state) => state.tasks;
const selectColumnsState = (state) => state.kanbanColumns;
const selectBacklogsState = (state) => state.backlogs;
const selectUsersState = (state) => state.users;
const selectSprintsState = (state) => state.sprints;

// Memoized selectors for state slices
const selectTasks = createSelector(
  [selectTasksState],
  (tasks) => ({
    tasks: tasks.tasks,
    status: tasks.status,
    error: tasks.error,
  })
);

const selectColumns = createSelector(
  [selectColumnsState],
  (columns) => ({
    columns: columns.columns,
    status: columns.status,
    error: columns.error,
  })
);

const selectBacklogs = createSelector(
  [selectBacklogsState],
  (backlogs) => backlogs.backlogs || []
);

const selectUsers = createSelector(
  [selectUsersState],
  (users) => users.users || []
);

const selectSprints = createSelector(
  [selectSprintsState],
  (sprints) => sprints.sprints || []
);

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

  // Use memoized selectors
  const { tasks } = useSelector(selectTasks); // Only use tasks, as status and error come from useTask
  const { columns, status: columnStatus, error: columnError } = useSelector(selectColumns);
  const backlogs = useSelector(selectBacklogs);
  const users = useSelector(selectUsers);
  const sprints = useSelector(selectSprints);

  // Local state
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [backlogFilter, setBacklogFilter] = useState('all');
  const [selectedBacklog, setSelectedBacklog] = useState(null);
  const [sprintFilter, setSprintFilter] = useState('all');
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);

  // Use the useTask hook
  const {
    isCreatingTask,
    kanbanError,
    setKanbanError,
    dialogOpen,
    setDialogOpen,
    currentColumn,
    setCurrentColumn,
    isEditing,
    setIsEditing,
    editingTask,
    setEditingTask,
    dialogMode,
    setDialogMode,
    formValues,
    setFormValues,
    subtasks,
    setSubtasks,
    newSubtask,
    setNewSubtask,
    editingSubtaskIndex,
    editingSubtaskText,
    setEditingSubtaskText,
    handleAddSubtask,
    handleRemoveSubtask,
    handleToggleSubtask,
    handleEditSubtask,
    handleSaveSubtaskEdit,
    handleCancelSubtaskEdit,
    handleAddTask,
    handleEditTask,
    handleFormChange,
    handleRemoveAttachment,
    handleCreateTask,
    handleUpdateTask,
    handleDialogClose,
    fetchTasks, // Use fetchTasks from useTask
    taskStatus, // Use taskStatus from useTask
    taskError, // Use taskError from useTask
  } = useTask({ projectId, project, currentUser, projectUsers, createNotification });

  // Drag-and-drop
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

  // Memoized selector for columnsByStatus
  const selectColumnsByStatus = createSelector(
    [selectColumns, selectTasks, () => currentUser.id, () => backlogFilter, () => selectedBacklog],
    (columnsState, tasksState, userId, backlogFilter, selectedBacklog) => {
      return columnsState.columns.reduce((acc, col) => {
        acc[col.name] = tasksState.tasks.filter((task) => {
          const isCreatedByUser = task.createdByUserId === userId;
          const isAssignedToUser = task.assignedUserIds?.includes(userId);
          const matchesUserCriteria = isCreatedByUser || isAssignedToUser;
          const matchesStatus = task.status === col.name;
          let matchesBacklog = true;

          if (backlogFilter === 'none') {
            matchesBacklog = !task.backlogIds || task.backlogIds.length === 0;
          } else if (backlogFilter === 'all') {
            matchesBacklog = task.backlogIds && task.backlogIds.length > 0;
          } else if (backlogFilter !== 'all' && selectedBacklog) {
            matchesBacklog = task.backlogIds?.includes(parseInt(selectedBacklog.id));
          }

          return matchesUserCriteria && matchesStatus && matchesBacklog;
        });
        return acc;
      }, {});
    }
  );

  const columnsByStatus = useSelector(selectColumnsByStatus);

  // Memoized selector for filteredColumns
  const selectFilteredColumns = createSelector(
    [selectColumns, () => columnsByStatus, () => selectedUser, () => selectedPriority],
    (columnsState, columnsByStatus, selectedUser, selectedPriority) => {
      return columnsState.columns.reduce((acc, col) => {
        acc[col.name] = (columnsByStatus[col.name] || []).filter((task) => {
          const matchesUser = selectedUser ? task.assignedUserEmails?.includes(selectedUser) : true;
          const matchesPriority = selectedPriority
            ? normalizePriority(task.priority).toLowerCase() === selectedPriority.toLowerCase()
            : true;
          return matchesUser && matchesPriority;
        });
        return acc;
      }, {});
    }
  );

  const filteredColumns = useSelector(selectFilteredColumns);

  // Fetch project, columns, backlogs, and users
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

      if (!users || users.length === 0) {
        try {
          await dispatch(fetchUsers()).unwrap();
        } catch (userErr) {
          console.error('[loadData] Failed to fetch users:', userErr);
        }
      }

      await Promise.all([
        fetchTasks(), // Use fetchTasks from useTask hook
        dispatch(fetchKanbanColumns({ projectId: parseInt(projectId) })).unwrap().catch((err) => {
          console.error('[loadData] Failed to fetch columns:', err);
          return [];
        }),
        dispatch(fetchBacklogs({ projectId: parseInt(projectId) })).unwrap().catch((err) => {
          console.error('[loadData] Failed to fetch backlogs:', err);
          return [];
        }),
        dispatch(fetchSprints({ projectId: parseInt(projectId) })).unwrap().catch((err) => {
          console.error('[loadData] Failed to fetch sprints:', err);
          return [];
        }),
      ]);

      const projectUserEmails = [
        ...(normalizedProject.projectManagers || []),
        ...(normalizedProject.productOwners || []),
        ...(normalizedProject.scrumMasters || []),
        ...(normalizedProject.users || []),
        ...(normalizedProject.testers || []),
        ...(normalizedProject.observers || []),
      ].filter((email, index, self) => email && self.indexOf(email) === index && typeof email === 'string' && email.includes('@'));

      const projectUsersData = projectUserEmails
        .map((email) => {
          const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          return user
            ? { id: user.id, email: user.email, firstName: user.firstName || '', lastName: user.lastName || '', name: user.firstName ? `${user.firstName} ${user.lastName}` : email, costPerHour: user.costPerHour, costPerDay: user.costPerDay }
            : { id: null, email, firstName: '', lastName: '', name: email, costPerHour: null, costPerDay: null };
        })
        .filter((user) => user.email);

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
  }, [projectId, navigate, dispatch, users, setKanbanError, fetchTasks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle edit column
  const handleEditColumn = (column) => {
    setDialogMode('editColumn');
    setFormValues({ ...formValues, columnName: column.name, columnId: column.id, totalCost: formValues.totalCost ?? 0 });
    setDialogOpen(true);
  };

  // Handle delete column with confirmation
  const handleDeleteColumn = (columnId) => {
    setColumnToDelete(columnId);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteColumn = async () => {
    try {
      const column = columns.find((col) => col.id === columnToDelete);
      if (column) {
        const tasksInColumn = tasks.filter((task) => task.status === column.name);
        for (const task of tasksInColumn) {
          await dispatch(deleteTask(task.id)).unwrap();
        }
      }
      await dispatch(deleteKanbanColumn({ columnId: columnToDelete })).unwrap();
      setConfirmDeleteOpen(false);
      setColumnToDelete(null);
    } catch (err) {
      console.error('[confirmDeleteColumn] Error:', err);
      setKanbanError('Erreur lors de la suppression de la colonne.');
      setConfirmDeleteOpen(false);
      setColumnToDelete(null);
    }
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
        await handleCreateTask(columns);
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
    setKanbanError('');
    loadData();
  };

  // Render logic
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
              Tableau Kanban pour le projet : {project.title || 'Projet sans titre'}
            </PageTitle>
            {currentUser?.claims?.includes('CanCreateKanbanColumns') && (
              <StyledButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setDialogMode('addColumn');
                  setFormValues((prev) => ({ ...prev, columnName: '', totalCost: 0 }));
                  setDialogOpen(true);
                }}
                disabled={columns.length === 0}
              >
                Ajouter une colonne
              </StyledButton>
            )}
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
          {columns.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Aucune colonne trouvée. Ajoutez une colonne pour commencer à créer des tâches.
            </Alert>
          )}
          <KanbanFilters
            backlogs={backlogs || []}
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
                    minWidth: `${columns.length * 300 || 300}px`,
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
                        handleAddTask={() => handleAddTask(column.name, backlogFilter, selectedBacklog)}
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
                    handleAddTask={() => handleAddTask(getActiveColumn(activeId).name, backlogFilter, selectedBacklog)}
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
          <TaskDialog
            open={dialogOpen}
            onClose={handleDialogClose}
            dialogMode={dialogMode}
            isEditing={isEditing}
            isCreatingTask={isCreatingTask}
            kanbanError={kanbanError}
            formValues={formValues}
            handleFormChange={handleFormChange}
            handleFormSubmit={handleFormSubmit}
            currentColumn={currentColumn}
            editingTask={editingTask}
            projectUsers={projectUsers}
            backlogs={backlogs}
            getAvatarColor={getAvatarColor}
            generateInitials={generateInitials}
            getPriorityLabel={getPriorityLabel}
            subtasks={subtasks}
            newSubtask={newSubtask}
            setNewSubtask={setNewSubtask}
            handleAddSubtask={handleAddSubtask}
            handleRemoveSubtask={handleRemoveSubtask}
            handleToggleSubtask={handleToggleSubtask}
            handleEditSubtask={handleEditSubtask}
            handleSaveSubtaskEdit={handleSaveSubtaskEdit}
            editingSubtaskIndex={editingSubtaskIndex}
            editingSubtaskText={editingSubtaskText}
            setEditingSubtaskText={setEditingSubtaskText}
            handleCancelSubtaskEdit={handleCancelSubtaskEdit}
            theme={theme}
            handleRemoveAttachment={handleRemoveAttachment}
          />
          <DeleteColumnDialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={confirmDeleteColumn}
          />
        </Container>
      </Box>
    </KanbanContext.Provider>
  );
}

export default Kanban;