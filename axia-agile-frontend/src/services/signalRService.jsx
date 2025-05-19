import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection = null;
let messageCallbacks = [];

const signalRService = {
  connection: null,
  initialize: async (storeDispatch) => {
    if (connection) return;

    try {
      connection = new HubConnectionBuilder()
        .withUrl('https://localhost:7270/hubs/chat', {
          accessTokenFactory: () =>
            document.cookie.replace(/(?:(?:^|.*;\s*)AuthToken\s*=\s*([^;]*).*$)|^.*$/, '$1'),
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      signalRService.connection = connection;

      connection.on('ChannelCreated', (channel) => {
        storeDispatch({ type: 'chat/channelCreated', payload: channel });
      });

      connection.on('ChannelUpdated', (channel) => {
        storeDispatch({ type: 'chat/channelUpdated', payload: channel });
      });

      connection.on('ChannelDeleted', (channelId) => {
        storeDispatch({ type: 'chat/channelDeleted', payload: channelId });
      });

      connection.on('ReceiveMessage', (message) => {
        storeDispatch({ type: 'chat/messageReceived', payload: message });
        messageCallbacks.forEach(callback => callback(message));
      });

      await connection.start();
      storeDispatch({ type: 'chat/setConnectionStatus', payload: 'connected' });
    } catch (error) {
      storeDispatch({ type: 'chat/setConnectionStatus', payload: 'disconnected' });
      storeDispatch({ type: 'chat/setError', payload: error.message || 'Failed to initialize SignalR' });
      throw error;
    }
  },

  stop: async () => {
    if (connection) {
      await connection.stop();
      connection = null;
      signalRService.connection = null;
      messageCallbacks = []; // Clear callbacks to prevent memory leaks
      if (storeDispatch) {
        storeDispatch({ type: 'chat/setConnectionStatus', payload: 'disconnected' });
      }
    }
  },

  isConnected: () => connection && connection.state === 'Connected',

  onMessageReceived: (callback) => {
    messageCallbacks.push(callback);
    return () => {
      messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
    };
  },
};

export default signalRService;