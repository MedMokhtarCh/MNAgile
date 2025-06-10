import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

// Fetch backlogs for a project
export const fetchBacklogs = createAsyncThunk(
  'backlogs/fetchBacklogs',
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
  'backlogs/createBacklog',
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
  'backlogs/updateBacklog',
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
  'backlogs/deleteBacklog',
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
  'backlogs/linkTaskToBacklog',
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
  'backlogs/unlinkTaskFromBacklog',
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

const backlogSlice = createSlice({
  name: 'backlogs',
  initialState: {
    backlogs: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    updateBacklogTaskIds: (state, action) => {
      const { backlogId, taskId } = action.payload;
      const backlog = state.backlogs.find((b) => b.id === backlogId);
      if (backlog && !backlog.taskIds.includes(taskId)) {
        backlog.taskIds.push(taskId);
      }
    },
    clearBacklogsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      // Link task to backlog
      .addCase(linkTaskToBacklog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(linkTaskToBacklog.fulfilled, (state, action) => {
        state.status = 'succeeded';
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
      })
      .addCase(unlinkTaskFromBacklog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to unlink task from backlog';
      });
  },
});

export const { updateBacklogTaskIds, clearBacklogsError } = backlogSlice.actions;
export default backlogSlice.reducer;