import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice';

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

const normalizeRole = (role) => {
  if (!role) return null;
  
  return {
    id: role.id ?? role.Id,
    name: role.name ?? role.Name,
    iconName: role.iconName ?? 
              (role.id === 1 ? 'Security' : 
               role.id === 2 ? 'Security' : 
               role.id === 3 ? 'SupervisorAccount' : 'Person'),
  };
};

const normalizeClaim = (claim) => {
  if (!claim) return null;
  
  return {
    id: claim.id ?? claim.Id,
    name: claim.name ?? claim.Name,
    description: claim.description ?? claim.Description ?? '',
  };
};

// Utility for retrying API calls
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Roles');
      return response.data.map((role) => ({
        id: role.id,
        label: role.name,
        iconName: role.id === 1 ? 'Security' : 
                  role.id === 2 ? 'Security' : 
                  role.id === 3 ? 'SupervisorAccount' : 'Person',
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

export const createRole = createAsyncThunk(
  'users/createRole',
  async (roleData, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.post('/Roles', {
        Name: roleData.name
      });
      console.log('Created role response:', response.data);
      return normalizeRole(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de création du rôle');
    }
  }
);

export const updateRole = createAsyncThunk(
  'users/updateRole',
  async ({ id, name }, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.put(`/Roles/${id}`, {
        Name: name
      });
      return normalizeRole(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de mise à jour du rôle');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'users/deleteRole',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await userApi.delete(`/Roles/${id}`);
      return id;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de suppression du rôle');
    }
  }
);

export const fetchClaims = createAsyncThunk(
  'users/fetchClaims',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await withRetry(() => userApi.get('/Claims'), 3, 1000);
      console.log('Fetch claims response:', response.data); // Debug log
      return response.data.map((claim) => ({
        id: claim.id ?? claim.Id,
        label: claim.name ?? claim.Name,
        description: claim.description ?? claim.Description ?? '',
      }));
    } catch (error) {
      console.error('Fetch claims error:', error.response?.data, error.message); // Detailed error log
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch claims');
    }
  }
);

export const fetchClaimById = createAsyncThunk(
  'users/fetchClaimById',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get(`/Claims/${id}`);
      return normalizeClaim(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de récupération du claim');
    }
  }
);

export const createClaim = createAsyncThunk(
  'users/createClaim',
  async (claimData, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.post('/Claims', {
        Name: claimData.name,
        Description: claimData.description
      });
      return normalizeClaim(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de création du claim');
    }
  }
);

export const updateClaim = createAsyncThunk(
  'users/updateClaim',
  async ({ id, name, description }, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.put(`/Claims/${id}`, {
        Name: name,
        Description: description
      });
      return normalizeClaim(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de mise à jour du claim');
    }
  }
);

export const deleteClaim = createAsyncThunk(
  'users/deleteClaim',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await userApi.delete(`/Claims/${id}`);
      return id;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de suppression du claim');
    }
  }
);

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
        payload.Entreprise = [1, 2].includes(targetRoleId) ? (userData.entreprise || '') : '';
      } else {
        payload.Entreprise = [1, 2].includes(targetRoleId) ? (existingUser.entreprise || '') : existingUser.entreprise;
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
    selectedRole: null,
    selectedClaim: null,
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
    clearSelectedRole: (state) => {
      state.selectedRole = null;
    },
    clearSelectedClaim: (state) => {
      state.selectedClaim = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        console.log('Users fetched:', action.payload);
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
        console.log('User updated:', action.payload);
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
      })
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
        console.log('Roles fetched:', action.payload);
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(createRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        const roleFormatted = {
          id: action.payload.id,
          label: action.payload.name,
          iconName: action.payload.iconName,
          disabled: false
        };
        console.log('Adding role to state:', roleFormatted);
        state.roles.push(roleFormatted);
        state.snackbar = { open: true, message: 'Rôle créé avec succès', severity: 'success' };
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = {
            ...state.roles[index],
            label: action.payload.name,
          };
        }
        state.snackbar = { open: true, message: 'Rôle mis à jour avec succès', severity: 'success' };
        console.log('Role updated:', action.payload);
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.snackbar = { open: true, message: 'Rôle supprimé avec succès', severity: 'success' };
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(fetchClaims.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload;
        console.log('Claims fetched:', action.payload);
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.loading = false;
        // Only show snackbar for non-transient errors
        if (action.payload !== 'Failed to fetch claims') {
          state.snackbar = { open: true, message: action.payload, severity: 'error' };
        }
      })
      .addCase(fetchClaimById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClaimById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClaim = action.payload;
        console.log('Claim fetched by ID:', action.payload);
      })
      .addCase(fetchClaimById.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(createClaim.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClaim.fulfilled, (state, action) => {
        state.loading = false;
        const claimFormatted = {
          id: action.payload.id,
          label: action.payload.name,
          description: action.payload.description
        };
        state.claims.push(claimFormatted);
        state.snackbar = { open: true, message: 'Claim créé avec succès', severity: 'success' };
        console.log('Claim created:', claimFormatted);
      })
      .addCase(createClaim.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(updateClaim.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClaim.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.claims.findIndex(claim => claim.id === action.payload.id);
        if (index !== -1) {
          state.claims[index] = {
            ...state.claims[index],
            label: action.payload.name,
            description: action.payload.description
          };
        }
        state.snackbar = { open: true, message: 'Claim mis à jour avec succès', severity: 'success' };
        console.log('Claim updated:', action.payload);
      })
      .addCase(updateClaim.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      })
      .addCase(deleteClaim.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteClaim.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = state.claims.filter(claim => claim.id !== action.payload);
        state.snackbar = { open: true, message: 'Claim supprimé avec succès', severity: 'success' };
      })
      .addCase(deleteClaim.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: action.payload, severity: 'error' };
      });
  },
});

export const { setSnackbar, clearUserExists, clearSelectedRole, clearSelectedClaim } = usersSlice.actions;
export default usersSlice.reducer;