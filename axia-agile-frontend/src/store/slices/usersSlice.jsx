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
    createdById: user.createdById ?? user.CreatedById ?? null,
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
  async (_, { dispatch }) => {
    try {
      const response = await userApi.get('/Users');
      return response.data.map(normalizeUser).filter((user) => user.email);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
      }
      return [];
    }
  }
);

export const fetchUsersByCreatedById = createAsyncThunk(
  'users/fetchUsersByCreatedById',
  async (createdById, { dispatch }) => {
    try {
      const response = await userApi.get(`/Users/created-by/${createdById}`);
      return response.data
        .filter((user) => user && (user.id || user.Id) && user.email) // Ensure id and email exist
        .map(normalizeUser);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
      }
      return [];
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
    const tempId = `temp-${Date.now()}`;
    
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

      // Optimistic update
      const optimisticUser = {
        ...userData,
        id: tempId,
        isActive: true,
        dateCreated: new Date().toISOString(),
        claimIds: userData.claimIds || [],
        createdById: userData.createdById || null,
      };
      dispatch(optimisticCreateUser(normalizeUser(optimisticUser)));

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
        CreatedById: userData.createdById || null,
      });

      dispatch(removeOptimisticUser(tempId));
      return normalizeUser(response.data);
    } catch (error) {
      dispatch(removeOptimisticUser(tempId));
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'ce email existe déja');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue, getState, dispatch }) => {
    try {
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

      const payload = {
        Email: userData.email ?? existingUser.email,
        FirstName: userData.firstName ?? existingUser.firstName,
        LastName: userData.lastName ?? existingUser.lastName,
        PhoneNumber: userData.phoneNumber ?? existingUser.phoneNumber,
        RoleId: userData.roleId ?? existingUser.roleId,
        ClaimIds: userData.claimIds ?? existingUser.claimIds,
        CreatedById: userData.createdById ?? existingUser.createdById,
      };

      const targetRoleId = userData.roleId ?? existingUser.roleId;
      payload.JobTitle = [3, 4].includes(targetRoleId) 
        ? (userData.jobTitle ?? existingUser.jobTitle ?? 'Non défini')
        : existingUser.jobTitle;

      payload.Entreprise = [1, 2].includes(targetRoleId)
        ? (userData.entreprise ?? existingUser.entreprise ?? '')
        : '';

      if (userData.password) {
        payload.Password = userData.password;
      }

      const response = await userApi.put(`/Users/${id}`, payload);
      return normalizeUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la mise à jour');
    }
  }
);

export const updateUserClaims = createAsyncThunk(
  'users/updateUserClaims',
  async ({ id, claimIds }, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.patch(`/Users/${id}/claims`, { ClaimIds: claimIds });
      return normalizeUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      if (error.response?.status === 403) {
        return rejectWithValue('Vous n\'avez pas l\'autorisation de modifier les claims de cet utilisateur.');
      }
      if (error.response?.status === 404) {
        return rejectWithValue('Utilisateur non trouvé.');
      }
      if (error.response?.status === 400) {
        return rejectWithValue(error.response?.data?.message || 'Un ou plusieurs Claim IDs sont invalides.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la mise à jour des claims');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      // Optimistic update
      dispatch(removeUserOptimistically(id));
      
      await userApi.delete(`/Users/${id}`);
      return id;
    } catch (error) {
      // Revert optimistic update
      dispatch(fetchUsersByCreatedById(getState().auth.currentUser?.id));
      
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
      await userApi.patch(`/Users/${id}/status`, { isActive });
      return { id, isActive };
    } catch (error) {
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
    usersLoading: false,
    error: null,
    snackbar: { open: false, message: '', severity: 'success' },
    userExists: {},
    lastCreateSuccess: false,
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
    optimisticCreateUser: (state, action) => {
      state.users.push(action.payload);
      state.usersLoading = true;
    },
    removeOptimisticUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.usersLoading = false;
    },
    removeUserOptimistically: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.usersLoading = true;
    },
    setLastCreateSuccess: (state, action) => {
      state.lastCreateSuccess = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
        if (!state.lastCreateSuccess) {
          state.snackbar = {
            open: true,
            message: action.payload || 'Erreur lors du chargement des utilisateurs',
            severity: 'error'
          };
        }
        state.lastCreateSuccess = false;
      })
      .addCase(fetchUsersByCreatedById.pending, (state) => {
        state.usersLoading = true;
      })
  .addCase(fetchUsersByCreatedById.fulfilled, (state, action) => {
  state.usersLoading = false;
  const newUsers = action.payload;
  const existingUserIds = new Set(state.users.map((user) => user.id));
  state.users = [
    ...state.users.filter((user) => {
      if (!user.id) {
        console.warn('User with missing id:', user);
        return false;
      }
      return !String(user.id).startsWith('temp-') && !existingUserIds.has(user.id);
    }),
    ...newUsers,
  ];
})
      .addCase(fetchUsersByCreatedById.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload || 'Erreur lors du chargement des utilisateurs',
          severity: 'error'
        };
      })
      .addCase(checkUserExists.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(checkUserExists.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.userExists[action.payload.email] = action.payload.exists;
      })
      .addCase(checkUserExists.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(createUser.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: 'Utilisateur créé avec succès',
          severity: 'success'
        };
        state.lastCreateSuccess = true;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
        state.lastCreateSuccess = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.snackbar = {
          open: true,
          message: 'Utilisateur modifié avec succès',
          severity: 'success'
        };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: 'Utilisateur supprimé',
          severity: 'success'
        };
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
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
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(fetchRoles.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(createRole.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles.push({
          id: action.payload.id,
          label: action.payload.name,
          iconName: action.payload.iconName,
          disabled: false
        });
        state.snackbar = {
          open: true,
          message: 'Rôle créé avec succès',
          severity: 'success'
        };
      })
      .addCase(createRole.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index].label = action.payload.name;
        }
        state.snackbar = {
          open: true,
          message: 'Rôle mis à jour avec succès',
          severity: 'success'
        };
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.snackbar = {
          open: true,
          message: 'Rôle supprimé avec succès',
          severity: 'success'
        };
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(fetchClaims.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.claims = action.payload;
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.usersLoading = false;
        if (action.payload !== 'Failed to fetch claims') {
          state.snackbar = {
            open: true,
            message: action.payload,
            severity: 'error'
          };
        }
      })
      .addCase(fetchClaimById.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.selectedClaim = action.payload;
      })
      .addCase(fetchClaimById.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(createClaim.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.claims.push({
          id: action.payload.id,
          label: action.payload.name,
          description: action.payload.description
        });
        state.snackbar = {
          open: true,
          message: 'Claim créé avec succès',
          severity: 'success'
        };
      })
      .addCase(createClaim.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(updateClaim.fulfilled, (state, action) => {
        state.usersLoading = false;
        const index = state.claims.findIndex(claim => claim.id === action.payload.id);
        if (index !== -1) {
          state.claims[index] = {
            ...state.claims[index],
            label: action.payload.name,
            description: action.payload.description
          };
        }
        state.snackbar = {
          open: true,
          message: 'Claim mis à jour avec succès',
          severity: 'success'
        };
      })
      .addCase(updateClaim.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(deleteClaim.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.claims = state.claims.filter(claim => claim.id !== action.payload);
        state.snackbar = {
          open: true,
          message: 'Claim supprimé avec succès',
          severity: 'success'
        };
      })
      .addCase(deleteClaim.rejected, (state, action) => {
        state.usersLoading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      });
  },
});

export const {
  setSnackbar,
  clearUserExists,
  clearSelectedRole,
  clearSelectedClaim,
  optimisticCreateUser,
  removeOptimisticUser,
  removeUserOptimistically,
  setLastCreateSuccess,
} = usersSlice.actions;

export default usersSlice.reducer;