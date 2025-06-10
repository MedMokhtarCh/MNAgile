
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';
import { logout } from './authSlice';
import { normalizeClaim, withRetry } from '../../utils/normalize';

// Fetch claims
export const fetchClaims = createAsyncThunk(
  'claims/fetchClaims',
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

// Fetch claim by ID
export const fetchClaimById = createAsyncThunk(
  'claims/fetchClaimById',
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

const claimsSlice = createSlice({
  name: 'claims',
  initialState: {
    claims: [],
    selectedClaim: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedClaim: (state) => {
      state.selectedClaim = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClaims.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload;
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchClaimById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClaimById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClaim = action.payload;
      })
      .addCase(fetchClaimById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedClaim } = claimsSlice.actions;
export default claimsSlice.reducer;