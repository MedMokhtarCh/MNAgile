import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

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
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ taskData, attachments }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      const metadata = { createdIn: taskData.createdIn || 'kanban' };
      const taskPayload = { 
        ...taskData, 
        metadata,
        priority: normalizePriority(taskData.priority),
        backlogIds: taskData.backlogIds?.filter(id => id) || [],
        subtasks: taskData.subtasks?.filter(title => title.trim()) || [],
        sprintId: taskData.sprintId || null,
        assignedUserEmails: taskData.assignedUserEmails?.filter(email => email && email.trim()) || [],
        displayOrder: taskData.displayOrder || 0,
      };

      Object.keys(taskPayload).forEach((key) => {
        if (key === 'subtasks' && taskPayload[key].length > 0) {
          taskPayload[key].forEach((subtask, index) => {
            formData.append(`subtasks[${index}]`, subtask);
          });
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

      const response = await taskApi.post('/Tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

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

      Object.keys(taskPayload).forEach((key) => {
        if (key === 'subtasks') {
          taskPayload[key].forEach((subtask, index) => {
            formData.append(`subtasks[${index}]`, subtask.toString());
          });
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

      const response = await taskApi.put(`/Tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        errors: err.response?.data?.errors || null,
        status: err.response?.status || null,
      });
    }
  }
);

export const updateTaskPosition = createAsyncThunk(
  'tasks/updateTaskPosition',
  async ({ taskId, status, displayOrder }, { rejectWithValue }) => {
    try {
      const response = await taskApi.patch(`/Tasks/${taskId}/status`, { status, displayOrder });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await taskApi.delete(`/Tasks/${taskId}`);
      return taskId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
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

export const { setTasks, addTask, clearTasksError, updateTasksOrderOptimistically } = taskSlice.actions;
export default taskSlice.reducer;