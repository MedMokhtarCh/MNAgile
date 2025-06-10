import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
// Async thunk to fetch pending subscriptions
export const fetchPendingSubscriptions = createAsyncThunk(
  'abonement/fetchPendingSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get('/Subscriptions/pending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des abonnements.');
    }
  }
);

// Async thunk to validate a subscription
export const validateSubscription = createAsyncThunk(
  'abonement/validateSubscription',
  async (subscriptionId, { rejectWithValue }) => {
    try {
      await userApi.post(`/Subscriptions/${subscriptionId}/validate`);
      return subscriptionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Échec de la validation de l\'abonnement.');
    }
  }
);

const abonementSlice = createSlice({
  name: 'abonement',
  initialState: {
    subscriptions: [],
    loading: false,
    error: null,
    snackbar: {
      open: false,
      message: '',
      severity: 'info',
    },
  },
  reducers: {
    setSnackbar: (state, action) => {
      state.snackbar = {
        open: action.payload.open,
        message: action.payload.message || '',
        severity: action.payload.severity || 'info',
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Pending Subscriptions
    builder
      .addCase(fetchPendingSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload;
      })
      .addCase(fetchPendingSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      // Validate Subscription
      .addCase(validateSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = state.subscriptions.filter((sub) => sub.id !== action.payload);
        state.snackbar = {
          open: true,
          message: 'Abonnement validé avec succès.',
          severity: 'success',
        };
      })
      .addCase(validateSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      });
  },
});

export const { setSnackbar } = abonementSlice.actions;

export default abonementSlice.reducer;