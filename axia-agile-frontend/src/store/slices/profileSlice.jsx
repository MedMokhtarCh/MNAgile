import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileApi } from '../../services/api';
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileApi.get('/Profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await profileApi.put('/Profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'profile/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await profileApi.patch('/Profile/password', passwordData);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update password');
    }
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  'profile/uploadProfilePhoto',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await profileApi.post('/Profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to upload photo');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    profile: null,
    loading: false,
    error: null,
    snackbar: { open: false, message: '', severity: 'success' },
  },
  reducers: {
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.snackbar = {
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.snackbar = {
          open: true,
          message: 'Password updated successfully',
          severity: 'success',
        };
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error',
        };
      })
      // Upload Photo
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.snackbar = {
          open: true,
          message: 'Profile photo uploaded successfully',
          severity: 'success',
        };
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
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

export const { setSnackbar, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;