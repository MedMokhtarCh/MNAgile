import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice';
import { normalizeUser, normalizeSubscription } from '../../utils/normalize';
import { validateSubscription } from './signupSlice';

// Fetch users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Users');
      return response.data.map(user => ({
        ...normalizeUser(user),
        subscription: normalizeSubscription(user.subscription)
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des utilisateurs');
    }
  }
);

// Fetch users by createdById
export const fetchUsersByCreatedById = createAsyncThunk(
  'users/fetchUsersByCreatedById',
  async (createdById, { dispatch }) => {
    try {
      const response = await userApi.get(`/Users/created-by/${createdById}`);
      return response.data
        .filter((user) => user && (user.id || user.Id) && user.email)
        .map(normalizeUser);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
      }
      return [];
    }
  }
);

// Check if user exists
export const checkUserExists = createAsyncThunk(
  'users/checkUserExists',
  async (email, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.get('/Users/exists', { params: { email } });
      return { email, exists: response.data.exists, userId: response.data.userId };
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to check user existence');
    }
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue, getState, dispatch }) => {
    const tempId = `temp-${Date.now()}`;
    try {
      const { users } = getState().users;
      if (users.some((user) => user.email.toLowerCase() === userData.email.toLowerCase())) {
        return rejectWithValue('Cet email existe déjà.');
      }

      // Define required fields
      const requiredFields = ['email', 'firstName', 'lastName', 'password'];
      const missingFields = requiredFields.filter((field) => !userData[field]);
      if (missingFields.length > 0) {
        return rejectWithValue(`Champs requis manquants: ${missingFields.join(', ')}`);
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        return rejectWithValue('L’adresse email saisie n’est pas valide.');
      }

      // Validate password
      if (
        userData.password &&
        (userData.password.length < 12 ||
          !/[A-Z]/.test(userData.password) ||
          !/[a-z]/.test(userData.password) ||
          !/[0-9]/.test(userData.password) ||
          !/[!@#$%^&*]/.test(userData.password))
      ) {
        return rejectWithValue(
          'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*).'
        );
      }

      // Validate phoneNumber if provided
      if (userData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(userData.phoneNumber)) {
        return rejectWithValue('Le numéro de téléphone doit être au format international (+33123456789).');
      }

      // Validate entreprise for roleId === 2
      if (userData.roleId === 2 && !userData.entreprise) {
        return rejectWithValue('L’entreprise est requise pour les administrateurs.');
      }

      // Validate roleId
      if (!userData.roleId || userData.roleId <= 0) {
        return rejectWithValue('Un rôle valide est requis.');
      }

      // Validate costPerHour and costPerDay
      if (userData.costPerHour && userData.costPerHour < 0) {
        return rejectWithValue('Le coût par heure ne peut pas être négatif.');
      }
      if (userData.costPerDay && userData.costPerDay < 0) {
        return rejectWithValue('Le coût par jour ne peut pas être négatif.');
      }

      // Create optimistic user for UI
      const optimisticUser = {
        ...userData,
        id: tempId,
        isActive: true,
        dateCreated: new Date().toISOString(),
        claimIds: userData.claimIds || [],
        createdById: userData.createdById || null,
        rootAdminId: userData.rootAdminId || null,
        jobTitle: userData.jobTitle || null,
        costPerHour: userData.costPerHour || null,
        costPerDay: userData.costPerDay || null,
      };
      dispatch(optimisticCreateUser(normalizeUser(optimisticUser)));

      // Prepare payload for API
      const payload = {
        Email: userData.email,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName,
        PhoneNumber: userData.phoneNumber || null,
        Entreprise: userData.roleId === 2 ? userData.entreprise : null,
        RoleId: userData.roleId,
        ClaimIds: userData.claimIds || [],
        JobTitle: userData.jobTitle || null,
        CreatedById: userData.createdById || null,
        CostPerHour: userData.costPerHour || null,
        CostPerDay: userData.costPerDay || null,
      };

      const response = await userApi.post('/Users', payload);

      dispatch(removeOptimisticUser(tempId));
      return normalizeUser(response.data);
    } catch (error) {
      dispatch(removeOptimisticUser(tempId));
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la création de l’utilisateur.');
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue, getState, dispatch }) => {
    try {
      const { users } = getState().users;
      const existingUser = users.find((user) => user.id === id);

      if (!existingUser) {
        return rejectWithValue('Utilisateur non trouvé');
      }

      // Prepare payload for API, using provided values or existing ones
      const payload = {
        Email: userData.email ?? existingUser.email,
        FirstName: userData.firstName ?? existingUser.firstName,
        LastName: userData.lastName ?? existingUser.lastName,
        PhoneNumber: userData.phoneNumber ?? existingUser.phoneNumber,
        RoleId: userData.roleId ?? existingUser.roleId,
        ClaimIds: userData.claimIds ?? existingUser.claimIds,
        CreatedById: userData.createdById ?? existingUser.createdById,
        JobTitle: userData.jobTitle ?? existingUser.jobTitle ?? null,
        Entreprise: userData.entreprise ?? existingUser.entreprise ?? null,
        CostPerHour: userData.costPerHour ?? existingUser.costPerHour ?? null,
        CostPerDay: userData.costPerDay ?? existingUser.costPerDay ?? null,
      };

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

// Update user claims
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
        return rejectWithValue("Vous n'avez pas l'autorisation de modifier les claims de cet utilisateur.");
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

// Delete user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      dispatch(removeUserOptimistically(id));
      await userApi.delete(`/Users/${id}`);
      return id;
    } catch (error) {
      dispatch(fetchUsersByCreatedById(getState().auth.currentUser?.id));
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de la suppression de l\'utilisateur');
    }
  }
);

// Toggle user active status
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
    selectedRole: null,
    loading: false,
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
    optimisticCreateUser: (state, action) => {
      state.users.push(action.payload);
      state.loading = true;
    },
    removeOptimisticUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.loading = false;
    },
    removeUserOptimistically: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.loading = true;
    },
    setLastCreateSuccess: (state, action) => {
      state.lastCreateSuccess = action.payload;
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
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
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
        state.loading = true;
      })
      .addCase(fetchUsersByCreatedById.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload || 'Erreur lors du chargement des utilisateurs',
          severity: 'error'
        };
      })
      .addCase(checkUserExists.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkUserExists.fulfilled, (state, action) => {
        state.loading = false;
        state.userExists[action.payload.email] = {
          exists: action.payload.exists,
          userId: action.payload.userId,
        };
      })
      .addCase(checkUserExists.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== `temp-${action.payload.id}`);
        state.users.push(action.payload);
        state.snackbar = {
          open: true,
          message: 'Utilisateur créé avec succès',
          severity: 'success'
        };
        state.lastCreateSuccess = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        state.snackbar = {
          open: true,
          message: 'Utilisateur supprimé',
          severity: 'success'
        };
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
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
      .addCase(validateSubscription.fulfilled, (state, action) => {
        const { updatedUser } = action.payload;
        const userIndex = state.users.findIndex((u) => u.id === updatedUser.id);
        if (userIndex !== -1) {
          state.users[userIndex] = { ...state.users[userIndex], ...updatedUser };
        } else {
          state.users.push(updatedUser);
        }
      });
  },
});

export const {
  setSnackbar,
  clearUserExists,
  clearSelectedRole,
  optimisticCreateUser,
  removeOptimisticUser,
  removeUserOptimistically,
  setLastCreateSuccess,
} = usersSlice.actions;

export default usersSlice.reducer;