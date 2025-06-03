import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { discussionApi } from '../../services/api';
import signalRService from '../../services/signalRService';

// Initial state
const initialState = {
  channels: [],
  messages: {},
  members: {},
  connectionStatus: 'disconnected',
  error: null,
  selectedChannel: null,
  recentlyCreatedChannelIds: [],
};

// Async thunks
export const fetchChannels = createAsyncThunk('chat/fetchChannels', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await discussionApi.get('/discussion/channels');
    const channels = response.data.map(channel => ({
      ...channel,
      creatorId: parseInt(channel.creatorId, 10)
    }));
    channels.forEach(channel => {
      if (channel.members && Array.isArray(channel.members)) {
        dispatch(setChannelMembers({ channelId: channel.id, members: channel.members }));
      } else if (channel.memberIds && Array.isArray(channel.memberIds)) {
        // If only memberIds are included
      }
    });
    return channels;
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
    try {
      const response = await discussionApi.get(`/discussion/channels/${channelId}/members`);
      const members = response.data;
      return { channelId, members };
    } catch (error) {
      const state = getState();
      const channel = state.chat.channels.find(ch => ch.id === channelId);
      if (channel && channel.memberIds && Array.isArray(channel.memberIds)) {
        const allUsers = state.users.users || [];
        const members = allUsers.filter(user => channel.memberIds.includes(user.id));
        return { channelId, members };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channel members');
    }
  }
);
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ channelId, content, replyToId, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      formData.append('ChannelId', channelId);
      formData.append('Content', content || ''); // Ensure empty string for content
      
      if (replyToId) {
        formData.append('ReplyToId', replyToId);
      }
      
      files.forEach((file, index) => {
        formData.append('files', file); // Use 'files' to match backend
      });

      // Log FormData contents for debugging
      console.log('Sending message to /discussion/messages:', {
        channelId,
        content: content || 'empty',
        replyToId: replyToId || 'none',
        files: files.map(f => f.name),
      });

      const response = await discussionApi.post('/discussion/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Message sent successfully:', response.data);
      dispatch(playSound({ type: 'send' }));
      return response.data;
    } catch (error) {
      console.error('sendMessage error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to send message',
        status: error.response?.status,
        details: error.response?.data,
      });
    }
  }
);
export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (channelData, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await discussionApi.post('/discussion/channels', channelData);
      const channel = {
        ...response.data,
        creatorId: parseInt(response.data.creatorId, 10)
      };
      if (channelData.MemberIds && Array.isArray(channelData.MemberIds)) {
        const state = getState();
        const allUsers = state.users.users || [];
        const members = allUsers.filter(user => channelData.MemberIds.includes(user.id));
        dispatch(setChannelMembers({ 
          channelId: channel.id, 
          members 
        }));
      }
      dispatch(setRecentlyCreatedChannel(channel.id));
      return channel;
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
      console.log('UpdateChannel payload:', {
        channelId,
        channelData: {
          name: channelData.name,
          MemberIdsToAdd: channelData.MemberIdsToAdd,
          MemberIdsToRemove: channelData.MemberIdsToRemove
        }
      });
      const response = await discussionApi.put(`/discussion/channels/${channelId}`, {
        name: channelData.name,
        MemberIdsToAdd: channelData.MemberIdsToAdd || [],
        MemberIdsToRemove: channelData.MemberIdsToRemove || [],
      });
      const updatedChannel = {
        ...response.data,
        creatorId: parseInt(response.data.creatorId, 10)
      };
      const state = getState();
      const allUsers = state.users.users || [];
      const members = allUsers.filter(user => updatedChannel.memberIds.includes(user.id));
      console.log('Updated members for channel', channelId, ':', members);
      dispatch(setChannelMembers({ 
        channelId, 
        members
      }));
      return updatedChannel;
    } catch (error) {
      console.error('UpdateChannel error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return rejectWithValue(error.response?.data?.message || 'Failed to update channel');
    }
  }
);

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
      const channel = {
        ...action.payload,
        creatorId: parseInt(action.payload.creatorId, 10)
      };
      if (state.recentlyCreatedChannelIds.includes(channel.id)) {
        state.recentlyCreatedChannelIds = state.recentlyCreatedChannelIds.filter(id => id !== channel.id);
        return;
      }
      const channelExists = state.channels.some((ch) => ch.id === channel.id);
      if (!channelExists) {
        state.channels.push(channel);
      }
    },
    channelUpdated(state, action) {
      const updatedChannel = {
        ...action.payload,
        creatorId: parseInt(action.payload.creatorId, 10)
      };
      state.channels = state.channels.map(ch => 
        ch.id === updatedChannel.id ? { ...ch, ...updatedChannel } : ch
      );
      if (state.selectedChannel?.id === updatedChannel.id) {
        state.selectedChannel = updatedChannel;
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
      const exists = state.messages[message.channelId].some(
        (msg) => msg.id === message.id || 
                 (msg.senderId === message.senderId && 
                  msg.timestamp === message.timestamp && 
                  msg.content === message.content)
      );
      if (!exists) {
        state.messages[message.channelId].push(message);
      }
    },
    playSound(state, action) {
      // No state changes needed, just a trigger for the component to play sound
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
      setTimeout(() => {
        state.recentlyCreatedChannelIds = state.recentlyCreatedChannelIds.filter(id => id !== channelId);
      }, 5000);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        state.recentlyCreatedChannelIds = [];
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
        const exists = state.messages[message.channelId].some(
          (msg) => msg.id === message.id || 
                   (msg.senderId === message.senderId && 
                    msg.timestamp === message.timestamp && 
                    msg.content === message.content)
        );
        if (!exists) {
          state.messages[message.channelId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        const channel = action.payload;
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
  channelUpdated,
  channelDeleted,
  messageReceived,
  playSound,
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