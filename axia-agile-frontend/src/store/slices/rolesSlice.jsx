import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice';
import { setSnackbar } from './usersSlice';
import { normalizeRole } from '../../utils/normalize';



export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Roles');
      return response.data.map(normalizeRole);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        dispatch(setSnackbar({
          open: true,
          message: 'Session expirée. Veuillez vous reconnecter.',
          severity: 'error',
        }));
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      const message = error.response?.data?.message || 'Échec de la récupération des rôles';
      dispatch(setSnackbar({
        open: true,
        message,
        severity: 'error',
      }));
      return rejectWithValue(message);
    }
  }
);

export const fetchRolesByUserId = createAsyncThunk(
  'roles/fetchRolesByUserId',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get(`/Roles/createdBy/${userId}`);
      return response.data.map(normalizeRole);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        dispatch(setSnackbar({
          open: true,
          message: 'Session expirée. Veuillez vous reconnecter.',
          severity: 'error',
        }));
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
    
      dispatch(setSnackbar({
        open: true,
        message,
        severity: 'error',
      }));
      return rejectWithValue(message);
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.post('/Roles', {
        Name: roleData.name,
        CreatedByUserId: roleData.createdByUserId,
      });
      dispatch(setSnackbar({
        open: true,
        message: 'Rôle créé avec succès',
        severity: 'success',
      }));
      return normalizeRole(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        dispatch(setSnackbar({
          open: true,
          message: 'Session expirée. Veuillez vous reconnecter.',
          severity: 'error',
        }));
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      const message = error.response?.data?.message || 'Échec de création du rôle';
      dispatch(setSnackbar({
        open: true,
        message,
        severity: 'error',
      }));
      return rejectWithValue(message);
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, name }, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.put(`/Roles/${id}`, {
        Name: name,
      });
      dispatch(setSnackbar({
        open: true,
        message: 'Rôle mis à jour avec succès',
        severity: 'success',
      }));
      return normalizeRole(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        dispatch(setSnackbar({
          open: true,
          message: 'Session expirée. Veuillez vous reconnecter.',
          severity: 'error',
        }));
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      const message = error.response?.data?.message || 'Échec de mise à jour du rôle';
      dispatch(setSnackbar({
        open: true,
        message,
        severity: 'error',
      }));
      return rejectWithValue(message);
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await userApi.delete(`/Roles/${id}`);
      dispatch(setSnackbar({
        open: true,
        message: 'Rôle supprimé avec succès',
        severity: 'success',
      }));
      return id;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        dispatch(setSnackbar({
          open: true,
          message: 'Session expirée. Veuillez vous reconnecter.',
          severity: 'error',
        }));
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      const message = error.response?.data?.message || 'Échec de suppression du rôle';
      dispatch(setSnackbar({
        open: true,
        message,
        severity: 'error',
      }));
      return rejectWithValue(message);
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState: {
    roles: [],
    usersLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state) => {
        state.usersLoading = false;
      })
      .addCase(fetchRolesByUserId.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchRolesByUserId.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRolesByUserId.rejected, (state) => {
        state.usersLoading = false;
      })
      .addCase(createRole.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state) => {
        state.usersLoading = false;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.usersLoading = false;
        const index = state.roles.findIndex((role) => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state) => {
        state.usersLoading = false;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles = state.roles.filter((role) => role.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state) => {
        state.usersLoading = false;
      });
  },
});

export default rolesSlice.reducer;