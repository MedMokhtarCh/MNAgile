import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice';
import { normalizeUser, normalizeSubscription, withRetry, GetSubscriptionDuration } from '../../utils/normalize';
import { checkUserExists } from './usersSlice';
import { setSnackbar } from './usersSlice';

// Fetch pending subscriptions
export const fetchPendingSubscriptions = createAsyncThunk(
  'signup/fetchPendingSubscriptions',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await withRetry(() => userApi.get('/Subscriptions/pending'));
      return response.data.map(normalizeSubscription);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la récupération des abonnements en attente.'
      );
    }
  }
);

// Fetch subscription by ID
export const fetchSubscriptionById = createAsyncThunk(
  'signup/fetchSubscriptionById',
  async (subscriptionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await withRetry(() => userApi.get(`/Subscriptions/${subscriptionId}`));
      return normalizeSubscription(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la récupération des détails de l\'abonnement.'
      );
    }
  }
);

// Validate subscription
export const validateSubscription = createAsyncThunk(
  'signup/validateSubscription',
  async (subscriptionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await withRetry(() => userApi.post(`/Subscriptions/${subscriptionId}/validate`));
      const updatedSubscription = normalizeSubscription(response.data);
      const userResponse = await userApi.get(`/Users/${updatedSubscription.userId}`);
      const updatedUser = normalizeUser(userResponse.data);
      return { subscriptionId, updatedSubscription, updatedUser };
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Échec de la validation de l\'abonnement.'
      );
    }
  }
);

// Refresh subscriptions
export const refreshSubscriptions = createAsyncThunk(
  'signup/refreshSubscriptions',
  async (_, { dispatch }) => {
    try {
      await dispatch(fetchPendingSubscriptions()).unwrap();
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error || 'Erreur lors du rafraîchissement des abonnements.',
        severity: 'error',
      }));
    }
  }
);

// Signup user
export const signup = createAsyncThunk(
  'signup/signup',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const { email } = userData;
      const userExists = await dispatch(checkUserExists(email)).unwrap();
      if (userExists.exists) {
        return rejectWithValue('Cet email existe déjà.');
      }

      const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'entreprise', 'plan'];
      const missingFields = requiredFields.filter((field) => !userData[field]);
      if (missingFields.length > 0) {
        return rejectWithValue(`Champs requis manquants: ${missingFields.join(', ')}`);
      }

      const validPlans = ['monthly', 'quarterly', 'semiannual', 'annual'];
      if (!validPlans.includes(userData.plan)) {
        return rejectWithValue('Plan d\'abonnement invalide.');
      }

      const response = await withRetry(() =>
        userApi.post('/Subscriptions/signup', {
          Email: userData.email,
          Password: userData.password,
          FirstName: userData.firstName,
          LastName: userData.lastName,
          PhoneNumber: userData.phoneNumber,
          Entreprise: userData.entreprise,
          Plan: userData.plan,
        })
      );

      dispatch(setSnackbar({
        open: true,
        message: 'Inscription réussie. En attente de validation.',
        severity: 'success',
      }));

      return {
        user: normalizeUser({
          ...response.data,
          RoleId: 2,
          IsActive: false,
          ClaimIds: [1, 2, 3, 4],
          RootAdminId: null,
        }),
        subscriptionId: response.data.subscriptionId,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      if (error.response?.status === 400) {
        return rejectWithValue(error.response?.data?.message || 'Données d\'inscription invalides.');
      }
      return rejectWithValue(error.response?.data?.message || 'Échec de l\'inscription.');
    }
  }
);

// Renew subscription
export const renewSubscription = createAsyncThunk(
  'signup/renewSubscription',
  async ({ subscriptionId, plan }, { rejectWithValue, dispatch }) => {
    try {
      const validPlans = ['monthly', 'quarterly', 'semiannual', 'annual'];
      if (!validPlans.includes(plan)) {
        return rejectWithValue('Plan d\'abonnement invalide.');
      }

      const response = await withRetry(() =>
        userApi.post(`/Subscriptions/${subscriptionId}/renew`, { Plan: plan })
      );
      const updatedSubscription = normalizeSubscription({
        ...response.data,
        id: subscriptionId,
        plan,
        status: 'Pending',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + GetSubscriptionDuration(plan)).toISOString(),
      });

      dispatch(setSnackbar({
        open: true,
        message: 'Demande de renouvellement envoyée avec succès.',
        severity: 'success',
      }));

      return { subscriptionId, updatedSubscription };
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Échec du renouvellement de l\'abonnement.'
      );
    }
  }
);

// Check expired subscriptions
export const checkExpiredSubscriptions = createAsyncThunk(
  'signup/checkExpiredSubscriptions',
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
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la vérification des abonnements expirés.');
    }
  }
);

const signupSlice = createSlice({
  name: 'signup',
  initialState: {
    pendingSubscriptions: [],
    selectedSubscription: null,
    signupLoading: false,
    error: null,
  },
  reducers: {
    clearSelectedSubscription: (state) => {
      state.selectedSubscription = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingSubscriptions.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingSubscriptions.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.pendingSubscriptions = action.payload;
      })
      .addCase(fetchPendingSubscriptions.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.selectedSubscription = action.payload;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(validateSubscription.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(validateSubscription.fulfilled, (state, action) => {
        state.signupLoading = false;
        const { subscriptionId, updatedSubscription } = action.payload;
        state.pendingSubscriptions = state.pendingSubscriptions.filter(
          (sub) => sub.id !== subscriptionId
        );
        // Ne mettre à jour selectedSubscription que si c'est l'abonnement validé
        if (state.selectedSubscription?.id === subscriptionId) {
          state.selectedSubscription = updatedSubscription;
        }
      })
      .addCase(validateSubscription.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(signup.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.pendingSubscriptions.push({
          id: action.payload.subscriptionId,
          userId: action.payload.user.id,
          plan: action.payload.user.subscription?.plan || 'annual',
          status: 'Pending',
          startDate: new Date().toISOString(),
          endDate: '',
          user: {
            id: action.payload.user.id,
            email: action.payload.user.email,
            firstName: action.payload.user.firstName,
            lastName: action.payload.user.lastName,
            entreprise: action.payload.user.entreprise,
          },
        });
      })
      .addCase(signup.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(renewSubscription.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.signupLoading = false;
        const { updatedSubscription } = action.payload;
        state.pendingSubscriptions.push(updatedSubscription);
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(checkExpiredSubscriptions.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(checkExpiredSubscriptions.fulfilled, (state) => {
        state.signupLoading = false;
      })
      .addCase(checkExpiredSubscriptions.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      })
      .addCase(refreshSubscriptions.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(refreshSubscriptions.fulfilled, (state) => {
        state.signupLoading = false;
      })
      .addCase(refreshSubscriptions.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedSubscription } = signupSlice.actions;
export default signupSlice.reducer;