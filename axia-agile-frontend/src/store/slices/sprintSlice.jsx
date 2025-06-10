import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

// Fetch sprints for a project
export const fetchSprints = createAsyncThunk(
  'sprints/fetchSprints',
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
  'sprints/createSprint',
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
  'sprints/updateSprint',
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
  'sprints/deleteSprint',
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

const sprintSlice = createSlice({
  name: 'sprints',
  initialState: {
    sprints: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearSprintsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      })
      .addCase(deleteSprint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete sprint';
      });
  },
});

export const { clearSprintsError } = sprintSlice.actions;
export default sprintSlice.reducer;