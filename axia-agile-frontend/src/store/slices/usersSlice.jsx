import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice'; // Import logout action

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id ?? user.Id,
    email: user.email ?? user.Email,
    firstName: user.firstName ?? user.FirstName ?? '',
    lastName: user.lastName ?? user.LastName ?? '',
    phoneNumber: user.phoneNumber ?? user.PhoneNumber ?? '',
    jobTitle: user.jobTitle ?? user.JobTitle ?? '',
    entreprise: user.entreprise ?? user.Entreprise ?? '',
    isActive: user.isActive ?? user.IsActive ?? true,
    roleId: user.roleId ?? user.RoleId ?? 4,
    claimIds: user.claimIds ?? user.ClaimIds ?? [],
    dateCreated: user.dateCreated ?? user.DateCreated ?? new Date().toISOString(),
    lastLogin: user.lastLogin ?? user.LastLogin ?? null,
    createdBy: user.createdBy ?? user.CreatedBy ?? null,
  };
};

// Fetch all roles
export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Roles');
      return response.data.map((role) => ({
        id: role.id,
        label: role.name,
        iconName: role.id === 1 ? 'Security' : role.id === 2 ? 'Security' : role.id === 3 ? 'SupervisorAccount' : 'Person',
        disabled: false,
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

// Fetch all claims
export const fetchClaims = createAsyncThunk(
  'users/fetchClaims',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Claims');
      return response.data.map((claim) => ({
        id: claim.id ?? claim.Id,
        label: claim.name ?? claim.Name,
        description: claim.description ?? claim.Description ?? '',
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch claims');
    }
  }
);

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Users');
      return response.data.map(normalizeUser).filter((user) => user.email);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Check if a user exists by email
export const checkUserExists = createAsyncThunk(
  'users/checkUserExists',
  async (email, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Users/exists', { params: { email } });
      return { email, exists: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to check user existence');
    }
  }
);

// Create a new user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue, getState, dispatch }) => {
    try {
      const { users } = getState().users;
      if (users.some((user) => user.email.toLowerCase() === userData.email.toLowerCase())) {
        return rejectWithValue('Cet email est déjà utilisé');
      }

      const requiredFields = ['email', 'firstName', 'lastName', 'password'];
      const missingFields = requiredFields.filter((field) => !userData[field]);
      if (missingFields.length > 0) {
        return rejectWithValue(`Champs requis manquants: ${missingFields.join(', ')}`);
      }

      const response = await userApi.post('/Users', {
        Email: userData.email,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName,
        PhoneNumber: userData.phoneNumber || null,
        Entreprise: userData.roleId === 2 ? userData.entreprise : '',
        RoleId: userData.roleId,
        ClaimIds: userData.claimIds || [],
        JobTitle: userData.roleId === 3 ? userData.jobTitle : userData.jobTitle || 'Administrateur',
      });
      return normalizeUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

// Update an existing user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('Updating user with data:', { id, userData });
      const { users } = getState().users;
      const existingUser = users.find((user) => user.id === id);

      if (!existingUser) {
        return rejectWithValue('Utilisateur non trouvé');
      }

      if (
        userData.email &&
        userData.email.toLowerCase() !== existingUser.email.toLowerCase() &&
        users.some((user) => user.email.toLowerCase() === userData.email.toLowerCase() && user.id !== id)
      ) {
        return rejectWithValue('Cet email est déjà utilisé par un autre utilisateur');
      }

      const payload = {};
      if (userData.email) payload.Email = userData.email;
      else payload.Email = existingUser.email;

      if (userData.firstName !== undefined) payload.FirstName = userData.firstName;
      else payload.FirstName = existingUser.firstName;

      if (userData.lastName !== undefined) payload.LastName = userData.lastName;
      else payload.LastName = existingUser.lastName;

      if (userData.phoneNumber !== undefined) payload.PhoneNumber = userData.phoneNumber || null;
      else payload.PhoneNumber = existingUser.phoneNumber;

      if (userData.roleId !== undefined) payload.RoleId = userData.roleId;
      else payload.RoleId = existingUser.roleId;

      if (userData.claimIds !== undefined) payload.ClaimIds = userData.claimIds || [];
      else payload.ClaimIds = existingUser.claimIds;

      const targetRoleId = userData.roleId !== undefined ? userData.roleId : existingUser.roleId;
      if (userData.jobTitle !== undefined) {
        payload.JobTitle = userData.jobTitle || 'Non défini';
      } else {
        payload.JobTitle = [3, 4].includes(targetRoleId) ? (existingUser.jobTitle || 'Non défini') : existingUser.jobTitle;
      }

      if (userData.entreprise !== undefined) {
        payload.Entreprise = targetRoleId === 2 ? (userData.entreprise || '') : '';
      } else {
        payload.Entreprise = targetRoleId === 2 ? (existingUser.entreprise || '') : existingUser.entreprise;
      }

      if (userData.password) {
        payload.Password = userData.password;
      }

      console.log('Sending update payload:', payload);
      const response = await userApi.put(`/Users/${id}`, payload);
      console.log('Update successful:', response.data);

      return normalizeUser(response.data);
    } catch (error) {
      console.error('Update user error:', error.response?.data);
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la mise à jour');
    }
  }
);

// Delete a user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await userApi.delete(`/Users/${id}`);
      return id;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Toggle user active status
export const toggleUserActive = createAsyncThunk(
  'users/toggleUserActive',
  async ({ id, isActive }, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Envoi de la requête PATCH pour l'utilisateur ${id} avec isActive=${isActive}`);
      const response = await userApi.patch(`/Users/${id}/status`, { isActive });
      console.log('Réponse du serveur:', response.data);
      return { id, isActive };
    } catch (error) {
      console.error('Erreur lors du toggle:', error);
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la mise à jour du statut');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    roles: [],
    claims: [],
    loading: false,
    error: null,
    snackbar: { open: false, message: '', severity: 'success' },
    userExists: {},
  },
  reducers: {
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
    },
    clearUserExists: (state, action) => {
      if (action.payload) {
        delete state.userExists[action.payload];
      } else {
        state.userExists = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(fetchClaims.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload;
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(checkUserExists.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkUserExists.fulfilled, (state, action) => {
        state.loading = false;
        state.userExists[action.payload.email] = action.payload.exists;
      })
      .addCase(checkUserExists.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
        state.snackbar = { open: true, message: 'Utilisateur créé avec succès', severity: 'success' };
      })
      .addCase(createUser.rejected, (state, action) => {
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.snackbar = { open: true, message: 'Utilisateur modifié avec succès', severity: 'success' };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.snackbar = { open: true, message: 'Utilisateur supprimé', severity: 'success' };
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        const user = state.users.find((user) => user.id === action.payload.id);
        if (user) {
          user.isActive = action.payload.isActive;
        }
        state.snackbar = {
          open: true,
          message: `Utilisateur ${action.payload.isActive ? 'activé' : 'désactivé'}`,
          severity: 'success',
        };
      })
      .addCase(toggleUserActive.rejected, (state, action) => {
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      });
  },
});

export const { setSnackbar, clearUserExists } = usersSlice.actions;
export default usersSlice.reducer;