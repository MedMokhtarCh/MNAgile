import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.Id || user.id,
    email: user.Email || user.email,
    firstName: user.FirstName || user.firstName || '',
    lastName: user.LastName || user.lastName || '',
    phoneNumber: user.PhoneNumber || user.phoneNumber || '',
    jobTitle: user.JobTitle || user.jobTitle || '',
    entreprise: user.Entreprise || user.entreprise || '',
    isActive: user.IsActive !== undefined ? user.IsActive : user.isActive !== undefined ? user.isActive : true,
    roleId: user.RoleId || user.roleId || 4,
    claimIds: user.ClaimIds || user.claimIds || [],
    dateCreated: user.DateCreated || user.dateCreated || new Date().toISOString(),
    lastLogin: user.LastLogin || user.lastLogin || null,
    createdBy: user.CreatedBy || user.createdBy || null,
  };
};

// Fetch all roles
export const fetchRoles = createAsyncThunk('users/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/Roles');
    return response.data.map((role) => ({
      id: role.id,
      label: role.name,
      iconName: role.id === 1 ? 'Security' : role.id === 2 ? 'Security' : role.id === 3 ? 'SupervisorAccount' : 'Person',
      disabled: false,
    }));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
  }
});

// Fetch all claims
export const fetchClaims = createAsyncThunk('users/fetchClaims', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/Claims');
    return response.data.map((claim) => ({
      id: claim.Id || claim.id,
      label: claim.Name || claim.name,
      description: claim.Description || claim.description || '',
    }));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch claims');
  }
});

// Fetch all users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/Users');
    return response.data.map(normalizeUser).filter(user => user.email);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
  }
});

// Create a new user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue, getState }) => {
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

      const response = await api.post('/Users', {
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
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

// Update an existing user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue, getState }) => {
    try {
      console.log('Updating user with data:', { id, userData });
      
      const { users } = getState().users;
      const existingUser = users.find(user => user.id === id);
      
      if (!existingUser) {
        return rejectWithValue('Utilisateur non trouvé');
      }

      // Validate email uniqueness if provided
      if (userData.email && userData.email.toLowerCase() !== existingUser.email.toLowerCase() &&
          users.some(user => 
            user.email.toLowerCase() === userData.email.toLowerCase() && 
            user.id !== id
          )) {
        return rejectWithValue('Cet email est déjà utilisé par un autre utilisateur');
      }

      // Build payload with only provided fields, fallback to existing user data
      const payload = {};

      // Required fields
      if (userData.email) payload.Email = userData.email;
      else payload.Email = existingUser.email;

      // Optional fields
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

      // Handle JobTitle for RoleId 3 or 4
      const targetRoleId = userData.roleId !== undefined ? userData.roleId : existingUser.roleId;
      if (userData.jobTitle !== undefined) {
        payload.JobTitle = userData.jobTitle || 'Non défini';
      } else {
        payload.JobTitle = [3, 4].includes(targetRoleId) ? (existingUser.jobTitle || 'Non défini') : existingUser.jobTitle;
      }

      // Handle Entreprise for RoleId 2
      if (userData.entreprise !== undefined) {
        payload.Entreprise = targetRoleId === 2 ? (userData.entreprise || '') : '';
      } else {
        payload.Entreprise = targetRoleId === 2 ? (existingUser.entreprise || '') : existingUser.entreprise;
      }

      // Password if provided
      if (userData.password) {
        payload.Password = userData.password;
      }

      console.log('Sending update payload:', payload);
      const response = await api.put(`/Users/${id}`, payload);
      console.log('Update successful:', response.data);
      
      return normalizeUser(response.data);
    } catch (error) {
      console.error('Update user error:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Échec de la mise à jour'
      );
    }
  });

// Delete a user
export const deleteUser = createAsyncThunk('users/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/Users/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
  }
});

// Toggle user active status
export const toggleUserActive = createAsyncThunk(
  'users/toggleUserActive',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      console.log(`Envoi de la requête PATCH pour l'utilisateur ${id} avec isActive=${isActive}`);
      const response = await api.patch(`/Users/${id}/status`, { isActive });
      console.log('Réponse du serveur:', response.data);
      return { id, isActive };
    } catch (error) {
      console.error('Erreur lors du toggle:', error);
      return rejectWithValue(error.message);
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
  },
  reducers: {
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
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
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
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
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
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
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
        state.snackbar = {
          open: true,
          message: 'Utilisateur créé avec succès',
          severity: 'success',
        };
      })
      .addCase(createUser.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.snackbar = {
          open: true,
          message: 'Utilisateur modifié avec succès',
          severity: 'success',
        };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
        state.snackbar = {
          open: true,
          message: 'Utilisateur supprimé',
          severity: 'success',
        };
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        const user = state.users.find(user => user.id === action.payload.id);
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
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      });
  },
});

export const { setSnackbar } = usersSlice.actions;
export default usersSlice.reducer;
