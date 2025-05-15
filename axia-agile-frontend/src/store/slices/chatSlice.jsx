import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { discussionApi } from '../../services/api';
import signalRService from '../../services/signalRService';

// Initial state
const initialState = {
  channels: [],
  messages: {},
  members: {}, // Store channel members by channelId
  connectionStatus: 'disconnected',
  error: null,
  selectedChannel: null,
  recentlyCreatedChannelIds: [], // New: Track recently created channel IDs
};

// Async thunks
export const fetchChannels = createAsyncThunk('chat/fetchChannels', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await discussionApi.get('/discussion/channels');
    
    // Extract and organize members from channel data
    const channels = response.data;
    channels.forEach(channel => {
      if (channel.members && Array.isArray(channel.members)) {
        dispatch(setChannelMembers({ channelId: channel.id, members: channel.members }));
      } else if (channel.memberIds && Array.isArray(channel.memberIds)) {
        // If only memberIds are included
      }
    });
    
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch channels');
  }
});

export const fetchChannelMessages = createAsyncThunk(
  'chat/fetchChannelMessages',
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await discussionApi.get(`/discussion/channels/${channelId}/messages`);
      return { channelId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
});

export const fetchChannelMembers = createAsyncThunk(
  'chat/fetchChannelMembers',
  async (channelId, { getState, rejectWithValue }) => {
    const state = getState();
    if (state.chat.members[channelId] && state.chat.members[channelId].length > 0) {
      return { channelId, members: state.chat.members[channelId] };
    }
    
    try {
      const response = await discussionApi.get(`/discussion/channels/${channelId}/members`);
      return { channelId, members: response.data };
    } catch (error) {
      const channel = state.chat.channels.find(ch => ch.id === channelId);
      if (channel && channel.memberIds && Array.isArray(channel.memberIds)) {
        const allUsers = state.users.users;
        const members = allUsers.filter(user => channel.memberIds.includes(user.id));
        return { channelId, members };
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channel members');
    }
});

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ channelId, content, replyToId, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('channelId', channelId);
      formData.append('content', content);
      if (replyToId) formData.append('replyToId', replyToId);
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`files[${index}]`, file);
        });
      }
      const response = await discussionApi.post('/discussion/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
});

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (channelData, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await discussionApi.post('/discussion/channels', channelData);
      
      if (channelData.MemberIds && Array.isArray(channelData.MemberIds)) {
        const state = getState();
        const allUsers = state.users.users;
        const members = allUsers.filter(user => channelData.MemberIds.includes(user.id));
        dispatch(setChannelMembers({ 
          channelId: response.data.id, 
          members 
        }));
      }
      
      // Flag the channel as recently created
      dispatch(setRecentlyCreatedChannel(response.data.id));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create channel');
    }
});

export const deleteChannel = createAsyncThunk(
  'chat/deleteChannel',
  async (channelId, { rejectWithValue }) => {
    try {
      await discussionApi.delete(`/discussion/channels/${channelId}`);
      return channelId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete channel');
    }
});

export const updateChannel = createAsyncThunk(
  'chat/updateChannel',
  async ({ channelId, channelData }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await discussionApi.put(`/discussion/channels/${channelId}`, channelData);
      
      if (channelData.MemberIdsToAdd && Array.isArray(channelData.MemberIdsToAdd)) {
        const state = getState();
        const allUsers = state.users.users;
        const newMembers = allUsers.filter(user => channelData.MemberIdsToAdd.includes(user.id));
        const existingMembers = state.chat.members[channelId] || [];
        dispatch(setChannelMembers({ 
          channelId, 
          members: [...existingMembers, ...newMembers]
        }));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update channel');
    }
});

export const initializeSignalR = createAsyncThunk(
  'chat/initializeSignalR',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await signalRService.initialize(dispatch);
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to initialize SignalR');
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    channelCreated(state, action) {
      const channel = action.payload;
      // Skip if the channel was recently created by this client
      if (state.recentlyCreatedChannelIds.includes(channel.id)) {
        // Clear the flag for this channel
        state.recentlyCreatedChannelIds = state.recentlyCreatedChannelIds.filter(id => id !== channel.id);
        return;
      }
      const channelExists = state.channels.some((ch) => ch.id === channel.id);
      if (!channelExists) {
        state.channels.push(channel);
      } else {
        // Update existing channel for ChannelUpdated event
        state.channels = state.channels.map(ch => 
          ch.id === channel.id ? { ...ch, ...channel } : ch
        );
      }
    },
    channelDeleted(state, action) {
      const channelId = action.payload;
      state.channels = state.channels.filter(ch => ch.id !== channelId);
      if (state.selectedChannel?.id === channelId) {
        state.selectedChannel = null;
      }
      delete state.messages[channelId];
      delete state.members[channelId];
    },
    messageReceived(state, action) {
      const message = action.payload;
      if (!state.messages[message.channelId]) {
        state.messages[message.channelId] = [];
      }
      state.messages[message.channelId].push(message);
    },
    resetChatState(state) {
      state.channels = [];
      state.messages = {};
      state.members = {};
      state.connectionStatus = 'disconnected';
      state.error = null;
      state.selectedChannel = null;
      state.recentlyCreatedChannelIds = [];
    },
    setSelectedChannel(state, action) {
      state.selectedChannel = action.payload;
    },
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setChannelMembers(state, action) {
      const { channelId, members } = action.payload;
      state.members[channelId] = members;
    },
    setRecentlyCreatedChannel(state, action) {
      const channelId = action.payload;
      state.recentlyCreatedChannelIds.push(channelId);
      // Optional: Clean up old IDs after a short delay to prevent memory buildup
      setTimeout(() => {
        state.recentlyCreatedChannelIds = state.recentlyCreatedChannelIds.filter(id => id !== channelId);
      }, 5000); // Clear after 5 seconds
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        state.recentlyCreatedChannelIds = []; // Clear on fetch to avoid stale IDs
        action.payload.forEach(channel => {
          if (channel.memberIds && Array.isArray(channel.memberIds) && !state.members[channel.id]) {
            state.members[channel.id] = [];
          }
        });
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchChannelMessages.fulfilled, (state, action) => {
        const { channelId, messages } = action.payload;
        state.messages[channelId] = messages;
      })
      .addCase(fetchChannelMessages.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        const { channelId, members } = action.payload;
        state.members[channelId] = members;
      })
      .addCase(fetchChannelMembers.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        if (!state.messages[message.channelId]) {
          state.messages[message.channelId] = [];
        }
        state.messages[message.channelId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        const channel = action.payload;
        // Only add if not already present (extra safety)
        if (!state.channels.some(ch => ch.id === channel.id)) {
          state.channels.push(channel);
        }
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        const channelId = action.payload;
        state.channels = state.channels.filter(ch => ch.id !== channelId);
        if (state.selectedChannel?.id === channelId) {
          state.selectedChannel = null;
        }
        delete state.messages[channelId];
        delete state.members[channelId];
      })
      .addCase(deleteChannel.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateChannel.fulfilled, (state, action) => {
        const updatedChannel = action.payload;
        state.channels = state.channels.map(ch => 
          ch.id === updatedChannel.id ? updatedChannel : ch
        );
        if (state.selectedChannel?.id === updatedChannel.id) {
          state.selectedChannel = updatedChannel;
        }
      })
      .addCase(updateChannel.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(initializeSignalR.pending, (state) => {
        state.connectionStatus = 'connecting';
      })
      .addCase(initializeSignalR.fulfilled, (state) => {
        state.connectionStatus = 'connected';
      })
      .addCase(initializeSignalR.rejected, (state, action) => {
        state.connectionStatus = 'disconnected';
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  channelCreated,
  channelDeleted,
  messageReceived,
  resetChatState,
  setSelectedChannel,
  setConnectionStatus,
  setError,
  setChannelMembers,
  setRecentlyCreatedChannel,
} = chatSlice.actions;

// Export selectors
export const selectChannels = (state) => state.chat.channels;
export const selectMessages = (state, channelId) => state.chat.messages[channelId] || [];
export const selectConnectionStatus = (state) => state.chat.connectionStatus;
export const selectChatError = (state) => state.chat.error;
export const selectChannelMembers = (state, channelId) => state.chat.members[channelId] || [];

export default chatSlice.reducer;