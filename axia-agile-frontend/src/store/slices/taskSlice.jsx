import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

// Normalize priority value
const normalizePriority = (priority) => {
  if (!priority) return 'MEDIUM';
  const priorityMap = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return priorityMap[priority.toUpperCase()] || 'MEDIUM';
};

// Fetch all tasks for a project, backlog, or sprint
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAllTasks',
  async ({ projectId, backlogId, sprintId }, { rejectWithValue }) => {
    try {
      let url = '/Tasks';
      const params = [];
      if (projectId) params.push(`projectId=${projectId}`);
      if (backlogId) params.push(`backlogId=${backlogId}`);
      if (sprintId && sprintId !== 'all' && sprintId !== 'none') {
        params.push(`sprintId=${sprintId}`);
      } else if (sprintId === 'none') {
        params.push(`sprintId=null`);
      }
      if (params.length) url += `?${params.join('&')}`;
      const response = await taskApi.get(url);
      console.log('[fetchAllTasks] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[fetchAllTasks] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
// Fetch Kanban columns for a project
export const fetchKanbanColumns = createAsyncThunk(
  'tasks/fetchKanbanColumns',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/KanbanColumns/project/${projectId}`);
      console.log('[fetchKanbanColumns] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[fetchKanbanColumns] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create a new Kanban column
export const createKanbanColumn = createAsyncThunk(
  'tasks/createKanbanColumn',
  async ({ columnData }, { rejectWithValue }) => {
    try {
      console.log('[createKanbanColumn] Sending payload:', columnData);
      const response = await taskApi.post('/KanbanColumns', columnData);
      console.log('[createKanbanColumn] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[createKanbanColumn] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update an existing Kanban column
export const updateKanbanColumn = createAsyncThunk(
  'tasks/updateKanbanColumn',
  async ({ columnId, columnData }, { rejectWithValue }) => {
    try {
      console.log('[updateKanbanColumn] Sending payload:', columnData);
      const response = await taskApi.put(`/KanbanColumns/${columnId}`, columnData);
      console.log('[updateKanbanColumn] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[updateKanbanColumn] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete a Kanban column and its associated tasks
export const deleteKanbanColumn = createAsyncThunk(
  'tasks/deleteKanbanColumn',
  async ({ columnId }, { getState, rejectWithValue }) => {
    try {
      console.log('[deleteKanbanColumn] Deleting column:', columnId);
      
      const state = getState();
      const columns = state.tasks.columns;
      const tasks = state.tasks.tasks;

      const column = columns.find((col) => col.id === columnId);
      if (!column) {
        throw new Error('Column not found');
      }

      const tasksInColumn = tasks.filter((task) => task.status === column.name);

      for (const task of tasksInColumn) {
        console.log('[deleteKanbanColumn] Deleting task:', task.id);
        await taskApi.delete(`/Tasks/${task.id}`);
      }

      await taskApi.delete(`/KanbanColumns/${columnId}`);
      console.log('[deleteKanbanColumn] Success:', columnId);
      return columnId;
    } catch (err) {
      console.error('[deleteKanbanColumn] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch backlogs for a project
export const fetchBacklogs = createAsyncThunk(
  'tasks/fetchBacklogs',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/Backlogs/project/${projectId}`);
      console.log('[fetchBacklogs] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[fetchBacklogs] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create a new backlog
export const createBacklog = createAsyncThunk(
  'tasks/createBacklog',
  async ({ backlogData }, { rejectWithValue }) => {
    try {
      console.log('[createBacklog] Sending payload:', backlogData);
      const response = await taskApi.post('/Backlogs', backlogData);
      console.log('[createBacklog] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[createBacklog] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update an existing backlog
export const updateBacklog = createAsyncThunk(
  'tasks/updateBacklog',
  async ({ backlogId, backlogData }, { rejectWithValue }) => {
    try {
      console.log('[updateBacklog] Sending payload:', backlogData);
      const response = await taskApi.put(`/Backlogs/${backlogId}`, backlogData);
      console.log('[updateBacklog] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[updateBacklog] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete a backlog
export const deleteBacklog = createAsyncThunk(
  'tasks/deleteBacklog',
  async ({ backlogId }, { rejectWithValue }) => {
    try {
      console.log('[deleteBacklog] Deleting backlog:', backlogId);
      await taskApi.delete(`/Backlogs/${backlogId}`);
      console.log('[deleteBacklog] Success:', backlogId);
      return backlogId;
    } catch (err) {
      console.error('[deleteBacklog] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Link a task to a backlog
export const linkTaskToBacklog = createAsyncThunk(
  'tasks/linkTaskToBacklog',
  async ({ backlogId, taskId }, { rejectWithValue }) => {
    try {
      console.log('[linkTaskToBacklog] Linking:', { backlogId, taskId });
      await taskApi.post(`/Backlogs/${backlogId}/tasks/${taskId}`);
      console.log('[linkTaskToBacklog] Success:', { backlogId, taskId });
      return { backlogId, taskId };
    } catch (err) {
      console.error('[linkTaskToBacklog] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Unlink a task from a backlog
export const unlinkTaskFromBacklog = createAsyncThunk(
  'tasks/unlinkTaskFromBacklog',
  async ({ backlogId, taskId }, { rejectWithValue }) => {
    try {
      console.log('[unlinkTaskFromBacklog] Unlinking:', { backlogId, taskId });
      await taskApi.delete(`/Backlogs/${backlogId}/tasks/${taskId}`);
      console.log('[unlinkTaskFromBacklog] Success:', { backlogId, taskId });
      return { backlogId, taskId };
    } catch (err) {
      console.error('[unlinkTaskFromBacklog] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch sprints for a project
export const fetchSprints = createAsyncThunk(
  'tasks/fetchSprints',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/Sprints/project/${projectId}`);
      console.log('[fetchSprints] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[fetchSprints] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create a new sprint
export const createSprint = createAsyncThunk(
  'tasks/createSprint',
  async ({ sprintData }, { rejectWithValue }) => {
    try {
      console.log('[createSprint] Sending payload:', sprintData);
      const response = await taskApi.post('/Sprints', sprintData);
      console.log('[createSprint] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[createSprint] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update an existing sprint
export const updateSprint = createAsyncThunk(
  'tasks/updateSprint',
  async ({ sprintId, sprintData }, { rejectWithValue }) => {
    try {
      console.log('[updateSprint] Sending payload:', sprintData);
      const response = await taskApi.put(`/Sprints/${sprintId}`, sprintData);
      console.log('[updateSprint] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[updateSprint] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete a sprint
export const deleteSprint = createAsyncThunk(
  'tasks/deleteSprint',
  async ({ sprintId }, { rejectWithValue }) => {
    try {
      console.log('[deleteSprint] Deleting sprint:', sprintId);
      await taskApi.delete(`/Sprints/${sprintId}`);
      console.log('[deleteSprint] Success:', sprintId);
      return sprintId;
    } catch (err) {
      console.error('[deleteSprint] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create a new task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ taskData, attachments }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      const metadata = { createdIn: taskData.createdIn || 'kanban' };
      const taskPayload = { 
        ...taskData, 
        metadata,
        priority: normalizePriority(taskData.priority),
        backlogIds: taskData.backlogIds?.filter(id => id) || [], // Filter out falsy values
        subtasks: taskData.subtasks?.filter(title => title.trim()) || [], // Filter out empty strings
        sprintId: taskData.sprintId || null,
        assignedUserEmails: taskData.assignedUserEmails?.filter(email => email && email.trim()) || [], // Ensure valid emails
        displayOrder: taskData.displayOrder || 0,
      };

      console.log('[createTask] Task Payload:', taskPayload);

      Object.keys(taskPayload).forEach((key) => {
        if (key === 'subtasks' && taskPayload[key].length > 0) {
          taskPayload[key].forEach((subtask, index) => {
            formData.append(`subtasks[${index}]`, subtask);
          });
          console.log('[createTask] Subtasks Sent:', taskPayload[key]);
        } else if (key === 'assignedUserEmails' && taskPayload[key].length > 0) {
          taskPayload[key].forEach((email, index) => {
            formData.append(`assignedUserEmails[${index}]`, email);
          });
        } else if (Array.isArray(taskPayload[key]) && taskPayload[key].length > 0) {
          taskPayload[key].forEach((item, index) => {
            if (item) {
              formData.append(`${key}[${index}]`, item);
            }
          });
        } else if (taskPayload[key] !== null && taskPayload[key] !== undefined && !Array.isArray(taskPayload[key])) {
          formData.append(key, typeof taskPayload[key] === 'object' ? JSON.stringify(taskPayload[key]) : taskPayload[key]);
        }
      });

      if (attachments?.length) {
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      for (let [key, value] of formData.entries()) {
        console.log(`[createTask] FormData ${key}:`, value instanceof File ? value.name : value);
      }

      const response = await taskApi.post('/Tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[createTask] Response:', response.data);

      // After creating the task, update the backlog's taskIds
      if (taskPayload.backlogIds && taskPayload.backlogIds.length > 0) {
        taskPayload.backlogIds.forEach((backlogId) => {
          dispatch(updateBacklogTaskIds({ backlogId, taskId: response.data.id }));
        });
      }

      return response.data;
    } catch (err) {
      console.error('[createTask] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
// Update an existing task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData, attachments }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      const metadata = { createdIn: taskData.createdIn || taskData.metadata?.createdIn || 'kanban' };
      const taskPayload = { 
        ...taskData, 
        metadata,
        priority: normalizePriority(taskData.priority),
        backlogIds: taskData.backlogIds || [],
        subtasks: taskData.subtasks || [],
        sprintId: taskData.sprintId || null
      };

      console.log('[updateTask] Task Payload:', taskPayload);

      // Validate payload
      if (!taskPayload.title || !taskPayload.projectId) {
        throw new Error('Title and project ID are required');
      }

      Object.keys(taskPayload).forEach((key) => {
        if (key === 'subtasks') {
          taskPayload[key].forEach((subtask, index) => {
            formData.append(`subtasks[${index}]`, subtask.toString());
          });
          console.log('[updateTask] Subtasks Sent:', taskPayload[key]);
        } else if (Array.isArray(taskPayload[key])) {
          taskPayload[key].forEach((item, index) => {
            formData.append(`${key}[${index}]`, item ?? '');
          });
        } else if (taskPayload[key] !== null && taskPayload[key] !== undefined) {
          formData.append(key, typeof taskPayload[key] === 'object' ? JSON.stringify(taskPayload[key]) : taskPayload[key]);
        }
      });

      if (attachments?.length) {
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      for (let [key, value] of formData.entries()) {
        console.log(`[updateTask] FormData ${key}:`, value instanceof File ? value.name : value);
      }

      const response = await taskApi.put(`/Tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[updateTask] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[updateTask] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        } : null,
      });
      // Optionally refetch tasks to verify update
      if (err.response?.status === 500) {
        console.log('[updateTask] Attempting to verify update by refetching tasks');
        await taskApi.get(`/Tasks?projectId=${taskData.projectId}`);
      }
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        errors: err.response?.data?.errors || null,
        status: err.response?.status || null,
      });
    }
  }
);

// Update task position (status and displayOrder)
export const updateTaskPosition = createAsyncThunk(
  'tasks/updateTaskPosition',
  async ({ taskId, status, displayOrder }, { rejectWithValue }) => {
    try {
      console.log('[updateTaskPosition] Sending payload:', { taskId, status, displayOrder });
      const response = await taskApi.patch(`/Tasks/${taskId}/status`, { status, displayOrder });
      console.log('[updateTaskPosition] Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[updateTaskPosition] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete a task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      console.log('[deleteTask] Deleting task:', taskId);
      await taskApi.delete(`/Tasks/${taskId}`);
      console.log('[deleteTask] Success:', taskId);
      return taskId;
    } catch (err) {
      console.error('[deleteTask] Error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    columns: [],
    backlogs: [],
    sprints: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    clearTasksError: (state) => {
      state.error = null;
    },
    updateBacklogTaskIds: (state, action) => {
      const { backlogId, taskId } = action.payload;
      const backlog = state.backlogs.find((b) => b.id === backlogId);
      if (backlog && !backlog.taskIds.includes(taskId)) {
        backlog.taskIds.push(taskId);
      }
    },
    updateTasksOrderOptimistically: (state, action) => {
      const { columnName, newTasks } = action.payload;
      state.tasks = state.tasks.map((task) => {
        const newTask = newTasks.find((t) => t.id === task.id);
        if (newTask && task.status === columnName) {
          return { ...task, displayOrder: newTask.displayOrder };
        }
        return task;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tasks
      .addCase(fetchAllTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch tasks';
      })
      // Fetch Kanban columns
      .addCase(fetchKanbanColumns.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchKanbanColumns.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns = action.payload;
      })
      .addCase(fetchKanbanColumns.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch columns';
      })
      // Create Kanban column
      .addCase(createKanbanColumn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createKanbanColumn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns.push(action.payload);
      })
      .addCase(createKanbanColumn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create column';
      })
      // Update Kanban column
      .addCase(updateKanbanColumn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateKanbanColumn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.columns.findIndex((col) => col.id === action.payload.id);
        if (index !== -1) {
          state.columns[index] = action.payload;
        }
      })
      .addCase(updateKanbanColumn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update column';
      })
      // Delete Kanban column
      .addCase(deleteKanbanColumn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteKanbanColumn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns = state.columns.filter((col) => col.id !== action.payload);
        const column = state.columns.find((col) => col.id === action.payload);
        if (column) {
          state.tasks = state.tasks.filter((task) => task.status !== column.name);
        }
      })
      .addCase(deleteKanbanColumn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete column';
      })
      // Fetch backlogs
      .addCase(fetchBacklogs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBacklogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs = action.payload;
      })
      .addCase(fetchBacklogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch backlogs';
      })
      // Create backlog
      .addCase(createBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs.push(action.payload);
      })
      .addCase(createBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create backlog';
      })
      // Update backlog
      .addCase(updateBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.backlogs.findIndex((backlog) => backlog.id === action.payload.id);
        if (index !== -1) {
          state.backlogs[index] = action.payload;
        }
      })
      .addCase(updateBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update backlog';
      })
      // Delete backlog
      .addCase(deleteBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs = state.backlogs.filter((backlog) => backlog.id !== action.payload);
      })
      .addCase(deleteBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete backlog';
      })
      // Fetch sprints
      .addCase(fetchSprints.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch sprints';
      })
      // Create sprint
      .addCase(createSprint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints.push(action.payload);
      })
      .addCase(createSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create sprint';
      })
      // Update sprint
      .addCase(updateSprint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSprint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.sprints.findIndex((sprint) => sprint.id === action.payload.id);
        if (index !== -1) {
          state.sprints[index] = action.payload;
        }
      })
      .addCase(updateSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update sprint';
      })
      // Delete sprint
      .addCase(deleteSprint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteSprint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints = state.sprints.filter((sprint) => sprint.id !== action.payload);
        state.tasks = state.tasks.map((task) =>
          task.sprintId === action.payload ? { ...task, sprintId: null } : task
        );
      })
      .addCase(deleteSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete sprint';
      })
      // Link task to backlog
      .addCase(linkTaskToBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(linkTaskToBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { backlogId, taskId } = action.payload;
        const task = state.tasks.find((t) => t.id === taskId);
        if (task && !task.backlogIds.includes(backlogId)) {
          task.backlogIds.push(backlogId);
        }
      })
      .addCase(linkTaskToBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to link task to backlog';
      })
      // Unlink task from backlog
      .addCase(unlinkTaskFromBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(unlinkTaskFromBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { backlogId, taskId } = action.payload;
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.backlogIds = task.backlogIds.filter((id) => id !== backlogId);
        }
      })
      .addCase(unlinkTaskFromBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to unlink task from backlog';
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create task';
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update task';
      })
      // Update task position
      .addCase(updateTaskPosition.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTaskPosition.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTaskPosition.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update task position';
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete task';
      })
      
  },
});

export const { setTasks, addTask, clearTasksError, updateBacklogTaskIds, updateTasksOrderOptimistically } = taskSlice.actions;
export default taskSlice.reducer;