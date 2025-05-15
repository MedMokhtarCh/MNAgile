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

// Fetch all tasks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAllTasks',
  async ({ projectId, backlogId, sprintId }, { rejectWithValue }) => {
    try {
      let url = '/Tasks';
      const params = [];
      if (projectId) params.push(`projectId=${projectId}`);
      if (backlogId) params.push(`backlogId=${backlogId}`);
      if (sprintId) params.push(`sprintId=${sprintId}`);
      if (params.length) url += `?${params.join('&')}`;
      const response = await taskApi.get(url);
      return response.data;
    } catch (err) {
      console.error('[fetchAllTasks] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch Kanban columns
export const fetchKanbanColumns = createAsyncThunk(
  'tasks/fetchKanbanColumns',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/KanbanColumns/project/${projectId}`);
      return response.data;
    } catch (err) {
      console.error('[fetchKanbanColumns] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create Kanban column
export const createKanbanColumn = createAsyncThunk(
  'tasks/createKanbanColumn',
  async ({ columnData }, { rejectWithValue }) => {
    try {
      console.log('[createKanbanColumn] Sending payload:', columnData);
      const response = await taskApi.post('/KanbanColumns', columnData);
      return response.data;
    } catch (err) {
      console.error('[createKanbanColumn] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update Kanban column
export const updateKanbanColumn = createAsyncThunk(
  'tasks/updateKanbanColumn',
  async ({ columnId, columnData }, { rejectWithValue }) => {
    try {
      const response = await taskApi.put(`/KanbanColumns/${columnId}`, columnData);
      return response.data;
    } catch (err) {
      console.error('[updateKanbanColumn] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete Kanban column
export const deleteKanbanColumn = createAsyncThunk(
  'tasks/deleteKanbanColumn',
  async ({ columnId }, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/KanbanColumns/${columnId}`);
      return columnId;
    } catch (err) {
      console.error('[deleteKanbanColumn] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch backlogs
export const fetchBacklogs = createAsyncThunk(
  'tasks/fetchBacklogs',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/Backlogs/project/${projectId}`);
      return response.data;
    } catch (err) {
      console.error('[fetchBacklogs] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create backlog
export const createBacklog = createAsyncThunk(
  'tasks/createBacklog',
  async ({ backlogData }, { rejectWithValue }) => {
    try {
      console.log('[createBacklog] Sending payload:', backlogData);
      const response = await taskApi.post('/Backlogs', backlogData);
      return response.data;
    } catch (err) {
      console.error('[createBacklog] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update backlog
export const updateBacklog = createAsyncThunk(
  'tasks/updateBacklog',
  async ({ backlogId, backlogData }, { rejectWithValue }) => {
    try {
      console.log('[updateBacklog] Sending payload:', backlogData);
      const response = await taskApi.put(`/Backlogs/${backlogId}`, backlogData);
      return response.data;
    } catch (err) {
      console.error('[updateBacklog] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete backlog
export const deleteBacklog = createAsyncThunk(
  'tasks/deleteBacklog',
  async ({ backlogId }, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/Backlogs/${backlogId}`);
      return backlogId;
    } catch (err) {
      console.error('[deleteBacklog] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Link task to backlog
export const linkTaskToBacklog = createAsyncThunk(
  'tasks/linkTaskToBacklog',
  async ({ backlogId, taskId }, { rejectWithValue }) => {
    try {
      await taskApi.post(`/Backlogs/${backlogId}/tasks/${taskId}`);
      return { backlogId, taskId };
    } catch (err) {
      console.error('[linkTaskToBacklog] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Unlink task from backlog
export const unlinkTaskFromBacklog = createAsyncThunk(
  'tasks/unlinkTaskFromBacklog',
  async ({ backlogId, taskId }, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/Backlogs/${backlogId}/tasks/${taskId}`);
      return { backlogId, taskId };
    } catch (err) {
      console.error('[unlinkTaskFromBacklog] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch sprints
export const fetchSprints = createAsyncThunk(
  'tasks/fetchSprints',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/Sprints/project/${projectId}`);
      return response.data;
    } catch (err) {
      console.error('[fetchSprints] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create sprint
export const createSprint = createAsyncThunk(
  'tasks/createSprint',
  async ({ sprintData }, { rejectWithValue }) => {
    try {
      console.log('[createSprint] Sending payload:', sprintData);
      const response = await taskApi.post('/Sprints', sprintData);
      return response.data;
    } catch (err) {
      console.error('[createSprint] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update sprint
export const updateSprint = createAsyncThunk(
  'tasks/updateSprint',
  async ({ sprintId, sprintData }, { rejectWithValue }) => {
    try {
      console.log('[updateSprint] Sending payload:', sprintData);
      const response = await taskApi.put(`/Sprints/${sprintId}`, sprintData);
      return response.data;
    } catch (err) {
      console.error('[updateSprint] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete sprint
export const deleteSprint = createAsyncThunk(
  'tasks/deleteSprint',
  async ({ sprintId }, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/Sprints/${sprintId}`);
      return sprintId;
    } catch (err) {
      console.error('[deleteSprint] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ taskData, attachments }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Ensure createdIn is included in metadata
      const metadata = { createdIn: taskData.createdIn || 'kanban' }; // Default to 'kanban' if not specified
      const taskPayload = { 
        ...taskData, 
        metadata,
        priority: normalizePriority(taskData.priority), // Normalize priority
        backlogIds: taskData.backlogIds || [], // Ensure backlogIds is an array
        subtasks: taskData.subtasks || [], // Ensure subtasks is an array
        sprintId: taskData.sprintId || null // Include sprintId (null if not provided)
      };
      Object.keys(taskPayload).forEach((key) => {
        if (Array.isArray(taskPayload[key])) {
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

      const response = await taskApi.post('/Tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      console.error('[createTask] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData, attachments }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Preserve or set createdIn in metadata
      const metadata = { createdIn: taskData.createdIn || taskData.metadata?.createdIn || 'kanban' };
      const taskPayload = { 
        ...taskData, 
        metadata,
        priority: normalizePriority(taskData.priority), // Normalize priority
        backlogIds: taskData.backlogIds || [], // Ensure backlogIds is an array
        subtasks: taskData.subtasks || [], // Ensure subtasks is an array
        sprintId: taskData.sprintId || null // Include sprintId (null if not provided)
      };
      Object.keys(taskPayload).forEach((key) => {
        if (Array.isArray(taskPayload[key])) {
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

      const response = await taskApi.put(`/Tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      console.error('[updateTask] Error:', err);
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        errors: err.response?.data?.errors || null,
        status: err.response?.status || null
      });
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/Tasks/${taskId}`);
      return taskId;
    } catch (err) {
      console.error('[deleteTask] Error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

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
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Tasks
      .addCase(fetchAllTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to fetch tasks';
      })
      // Fetch Kanban Columns
      .addCase(fetchKanbanColumns.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchKanbanColumns.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns = action.payload;
      })
      .addCase(fetchKanbanColumns.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to fetch columns';
      })
      // Create Kanban Column
      .addCase(createKanbanColumn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createKanbanColumn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns.push(action.payload);
      })
      .addCase(createKanbanColumn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to create column';
      })
      // Update Kanban Column
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
        state.error = action.payload.message || 'Failed to update column';
      })
      // Delete Kanban Column
      .addCase(deleteKanbanColumn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteKanbanColumn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.columns = state.columns.filter((col) => col.id !== action.payload);
      })
      .addCase(deleteKanbanColumn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to update column';
      })
      // Fetch Backlogs
      .addCase(fetchBacklogs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBacklogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs = action.payload;
      })
      .addCase(fetchBacklogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to fetch backlogs';
      })
      // Create Backlog
      .addCase(createBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs.push(action.payload);
      })
      .addCase(createBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to create backlog';
      })
      // Update Backlog
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
        state.error = action.payload.message || 'Failed to update backlog';
      })
      // Delete Backlog
      .addCase(deleteBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backlogs = state.backlogs.filter((backlog) => backlog.id !== action.payload);
      })
      .addCase(deleteBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to delete backlog';
      })
      // Fetch Sprints
      .addCase(fetchSprints.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to fetch sprints';
      })
      // Create Sprint
      .addCase(createSprint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints.push(action.payload);
      })
      .addCase(createSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to create sprint';
      })
      // Update Sprint
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
        state.error = action.payload.message || 'Failed to update sprint';
      })
      // Delete Sprint
      .addCase(deleteSprint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteSprint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sprints = state.sprints.filter((sprint) => sprint.id !== action.payload);
        // Optionally clear sprintId from tasks
        state.tasks = state.tasks.map((task) =>
          task.sprintId === action.payload ? { ...task, sprintId: null } : task
        );
      })
      .addCase(deleteSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to delete sprint';
      })
      // Link Task to Backlog
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
        state.error = action.payload.message || 'Failed to link task to backlog';
      })
      // Unlink Task from Backlog
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
        state.error = action.payload.message || 'Failed to unlink task from backlog';
      })
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to create task';
      })
      // Update Task
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
        state.error = action.payload.message || 'Failed to update task';
      })
      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to delete task';
      });
  },
});

export const { setTasks, addTask, clearTasksError, updateBacklogTaskIds } = taskSlice.actions;
export default taskSlice.reducer;