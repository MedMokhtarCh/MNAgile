import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

// Fetch all tasks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAllTasks',
  async ({ projectId, backlogId }, { rejectWithValue }) => {
    try {
      let url = '/Tasks';
      const params = [];
      if (projectId) params.push(`projectId=${projectId}`);
      if (backlogId) params.push(`backlogId=${backlogId}`);
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

// Create task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ taskData, attachments }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Ensure createdIn is included in metadata
      const metadata = { createdIn: taskData.createdIn || 'kanban' }; // Default to 'kanban' if not specified
      const taskPayload = { ...taskData, metadata };
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
      const taskPayload = { ...taskData, metadata };
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
      return rejectWithValue(err.response?.data || err.message);
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
        state.error = action.payload || 'Failed to fetch tasks';
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
        state.error = action.payload || 'Failed to fetch columns';
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
        state.error = action.payload || 'Failed to create column';
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
        state.error = action.payload || 'Failed to update column';
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
        state.error = action.payload || 'Failed to delete column';
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
        state.error = action.payload || 'Failed to fetch backlogs';
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
        state.error = action.payload || 'Failed to create backlog';
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
        state.error = action.payload || 'Failed to update backlog';
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
        state.error = action.payload || 'Failed to delete backlog';
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
        state.error = action.payload || 'Failed to link task to backlog';
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
        state.error = action.payload || 'Failed to unlink task from backlog';
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
        state.error = action.payload || 'Failed to create task';
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
        state.error = action.payload || 'Failed to update task';
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
        state.error = action.payload || 'Failed to delete task';
      });
  },
});

export const { setTasks, addTask, clearTasksError, updateBacklogTaskIds } = taskSlice.actions;
export default taskSlice.reducer;