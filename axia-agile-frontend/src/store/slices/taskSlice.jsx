import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

// Async thunks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taskApi.get('/tasks');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to fetch tasks';
      console.error('Fetch all tasks error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchById',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to fetch task';
      console.error('Fetch task by ID error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ taskData, attachments = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add task data fields
      const fields = {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'Medium',
        status: taskData.status || 'ToDo',
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : null,
        endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : null,
        assignedUserEmails: taskData.assignedUserEmails || [],
        projectId: taskData.projectId || null,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (key === 'assignedUserEmails' && Array.isArray(value)) {
          value.forEach(email => {
            if (email) formData.append('assignedUserEmails', email);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }

      // Add attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await taskApi.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to create task';
      console.error('Create task error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, taskData, attachments = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add task data fields
      const fields = {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'Medium',
        status: taskData.status || 'ToDo',
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : null,
        endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : null,
        assignedUserEmails: taskData.assignedUserEmails || [],
        projectId: taskData.projectId || null,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (key === 'assignedUserEmails' && Array.isArray(value)) {
          value.forEach(email => {
            if (email) formData.append('assignedUserEmails', email);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }

      // Add attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await taskApi.put(`/tasks/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to update task';
      console.error('Update task error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (taskId, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/tasks/${taskId}`);
      return taskId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to delete task';
      console.error('Delete task error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Initial state
const initialState = {
  tasks: [],
  currentTask: null,
  status: 'idle',
  error: null,
};

// Slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearTasksError: (state) => {
      state.error = null;
    },
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tasks
      .addCase(fetchAllTasks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
        state.error = null;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Fetch task by ID
      .addCase(fetchTaskById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentTask = action.payload;
        state.error = null;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks.push(action.payload);
        state.currentTask = action.payload;
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.currentTask = action.payload;
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        if (state.currentTask && state.currentTask.id === action.payload) {
          state.currentTask = null;
        }
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// Extract actions and reducer
export const { clearCurrentTask, clearTasksError, setTasks } = tasksSlice.actions;
export default tasksSlice.reducer;