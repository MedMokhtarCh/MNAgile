import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';
import { logoutUser } from './authSlice';

// Helper functions
const isValidDate = (date) => {
  if (!date) return false;
  return !isNaN(new Date(date).getTime());
};

const validateAttachments = (attachments) => {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  attachments.forEach(file => {
    if (file.size > maxFileSize) {
      throw new Error(`File ${file.name} exceeds 10MB limit`);
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File ${file.name} has unsupported type`);
    }
  });
};

const parseError = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors) {
    return Object.values(error.response.data.errors).flat().join(', ');
  }
  if (error.response?.data) return JSON.stringify(error.response.data);
  return error.message || 'Unknown error';
};

const normalizeTask = (task) => ({
  id: task.id || task.Id,
  title: task.title || task.Title,
  description: task.description || task.Description,
  status: task.status || task.Status || 'ToDo',
  priority: task.priority || task.Priority || 'Medium',
  startDate: task.startDate || task.StartDate,
  endDate: task.endDate || task.EndDate,
  assignedUserEmails: task.assignedUserEmails || task.AssignedUserEmails || [],
  projectId: task.projectId || task.ProjectId,
  attachments: task.attachments || task.Attachments || [],
});

// Async thunks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAll',
  async ({ projectId }, { dispatch, rejectWithValue }) => {
    try {
      if (!projectId || projectId <= 0) {
        throw new Error('Valid projectId is required');
      }

      const config = {
        params: { projectId },
      };
      const response = await taskApi.get('/tasks', config);

      console.log('fetchAllTasks response:', response.data); // Debug log
      return Array.isArray(response.data) ? response.data.map(normalizeTask) : [];
    } catch (error) {
      const errorMessage = parseError(error);
      console.error('Fetch all tasks error:', errorMessage);
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue('Unauthorized: Invalid or expired token');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchById',
  async (taskId, { dispatch, rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/tasks/${taskId}`);
      return normalizeTask(response.data);
    } catch (error) {
      const errorMessage = parseError(error);
      console.error('Fetch task by ID error:', errorMessage);
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue('Unauthorized: Invalid or expired token');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ taskData, attachments = [] }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add task data fields (using PascalCase to match backend DTO)
      const fields = {
        Title: taskData.title,
        Description: taskData.description || '',
        Priority: taskData.priority || 'Medium',
        Status: taskData.status || 'ToDo',
        StartDate: isValidDate(taskData.startDate) ? new Date(taskData.startDate).toISOString() : null,
        EndDate: isValidDate(taskData.endDate) ? new Date(taskData.endDate).toISOString() : null,
        AssignedUserEmails: taskData.assignedUserEmails || [],
        ProjectId: taskData.projectId && taskData.projectId > 0 ? taskData.projectId : null,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (key === 'AssignedUserEmails' && Array.isArray(value)) {
          value.forEach(email => {
            if (email) formData.append('AssignedUserEmails', email);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      }

      // Validate and add attachments
      validateAttachments(attachments);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await taskApi.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return normalizeTask(response.data);
    } catch (error) {
      const errorMessage = parseError(error);
      console.error('Create task error:', errorMessage);
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue('Unauthorized: Invalid or expired token');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, taskData, attachments = [] }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add task data fields (using PascalCase to match backend DTO)
      const fields = {
        Title: taskData.title,
        Description: taskData.description || '',
        Priority: taskData.priority || 'Medium',
        Status: taskData.status || 'ToDo',
        StartDate: isValidDate(taskData.startDate) ? new Date(taskData.startDate).toISOString() : null,
        EndDate: isValidDate(taskData.endDate) ? new Date(taskData.endDate).toISOString() : null,
        AssignedUserEmails: taskData.assignedUserEmails || [],
        ProjectId: taskData.projectId && taskData.projectId > 0 ? taskData.projectId : null,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (key === 'AssignedUserEmails' && Array.isArray(value)) {
          value.forEach(email => {
            if (email) formData.append('AssignedUserEmails', email);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      }

      // Validate and add attachments
      validateAttachments(attachments);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await taskApi.put(`/tasks/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return normalizeTask(response.data);
    } catch (error) {
      const errorMessage = parseError(error);
      console.error('Update task error:', errorMessage);
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue('Unauthorized: Invalid or expired token');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (taskId, { dispatch, rejectWithValue }) => {
    try {
      await taskApi.delete(`/tasks/${taskId}`);
      return taskId;
    } catch (error) {
      const errorMessage = parseError(error);
      console.error('Delete task error:', errorMessage);
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue('Unauthorized: Invalid or expired token');
      }
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