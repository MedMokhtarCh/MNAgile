import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApi } from '../../services/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ type = null }, { rejectWithValue }) => {
    try {
      const response = await notificationApi.get('/notification', {
        params: { type },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.data?.message || 'Failed to fetch notifications';
      return rejectWithValue(message);
    }
  }
);

export const fetchNotificationById = createAsyncThunk(
  'notifications/fetchNotificationById',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationApi.get(`/notification/${notificationId}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.status === 404
          ? 'Notification not found.'
          : error.response?.data?.message || 'Failed to fetch notification';
      return rejectWithValue(message);
    }
  }
);

export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await notificationApi.post('/notification', notificationData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.status === 400
          ? 'Invalid notification data.'
          : error.response?.data?.message || 'Failed to create notification';
      return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.put(`/notification/${notificationId}/read`);
      return notificationId;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.status === 404
          ? 'Notification not found.'
          : error.response?.data?.message || 'Failed to mark notification as read';
      return rejectWithValue(message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.put('/notification/read-all');
      return true;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.data?.message || 'Failed to mark all notifications as read';
      return rejectWithValue(message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.delete(`/notification/${notificationId}`);
      return notificationId;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.status === 404
          ? 'Notification not found.'
          : error.response?.data?.message || 'Failed to delete notification';
      return rejectWithValue(message);
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.delete('/notification/user-notifications');
      return true;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.data?.message || 'Failed to delete all notifications';
      return rejectWithValue(message);
    }
  }
);
export const fetchNotificationsByUserId = createAsyncThunk(
  'notifications/fetchNotificationsByUserId',
  async ({ userId, fromDate = null, type = null }, { rejectWithValue }) => {
    try {
      const response = await notificationApi.get(`/notification/by-user/${userId}`, {
        params: { 
          type,
          fromDate: fromDate?.toISOString() // Convertir en format ISO pour l'API
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.response?.data?.message || 'Failed to fetch notifications for user';
      return rejectWithValue(message);
    }
  }
);
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    updateNotifications: (state, action) => {
      // Optionally handle specific updates from SignalR
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchNotificationById.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
        } else {
          state.notifications.push(action.payload);
        }
      })
      .addCase(fetchNotificationById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.pending, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.meta.arg);
        if (index !== -1) {
          state.notifications[index].isRead = true;
        }
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        // Already updated optimistically
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.meta.arg);
        if (index !== -1) {
          state.notifications[index].isRead = false;
        }
        state.error = action.payload;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteNotification.pending, (state, action) => {
        state.notifications = state.notifications.filter((n) => n.id !== action.meta.arg);
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        // Already removed optimistically
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.notifications = [];
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchNotificationsByUserId.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchNotificationsByUserId.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload;
    })
    .addCase(fetchNotificationsByUserId.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { addNotification, updateNotifications, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;