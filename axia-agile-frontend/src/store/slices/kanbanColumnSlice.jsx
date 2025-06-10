import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/api';

export const fetchKanbanColumns = createAsyncThunk(
  'kanbanColumns/fetchKanbanColumns',
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await taskApi.get(`/KanbanColumns/project/${projectId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createKanbanColumn = createAsyncThunk(
  'kanbanColumns/createKanbanColumn',
  async ({ columnData }, { rejectWithValue }) => {
    try {
      const response = await taskApi.post('/KanbanColumns', columnData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateKanbanColumn = createAsyncThunk(
  'kanbanColumns/updateKanbanColumn',
  async ({ columnId, columnData }, { rejectWithValue }) => {
    try {
      const response = await taskApi.put(`/KanbanColumns/${columnId}`, columnData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteKanbanColumn = createAsyncThunk(
  'kanbanColumns/deleteKanbanColumn',
  async ({ columnId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const columns = state.kanbanColumns.columns;
      const tasks = state.tasks.tasks;

      const column = columns.find((col) => col.id === columnId);
      if (!column) {
        throw new Error('Column not found');
      }

      const tasksInColumn = tasks.filter((task) => task.status === column.name);
      for (const task of tasksInColumn) {
        await taskApi.delete(`/Tasks/${task.id}`);
      }

      await taskApi.delete(`/KanbanColumns/${columnId}`);
      return columnId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const kanbanColumnSlice = createSlice({
  name: 'kanbanColumns',
  initialState: {
    columns: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearColumnsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { clearColumnsError } = kanbanColumnSlice.actions;
export default kanbanColumnSlice.reducer;