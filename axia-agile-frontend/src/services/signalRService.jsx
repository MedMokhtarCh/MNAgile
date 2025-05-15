import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection = null;
let dispatch = null;

const signalRService = {
  initialize: async (storeDispatch) => {
    if (connection) return;

    dispatch = storeDispatch;
    try {
      connection = new HubConnectionBuilder()
        .withUrl('https://localhost:7270/hubs/chat', {
          accessTokenFactory: () =>
            document.cookie.replace(/(?:(?:^|.*;\s*)AuthToken\s*=\s*([^;]*).*$)|^.*$/, '$1'),
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      connection.on('ChannelCreated', (channel) => {
        dispatch({ type: 'chat/channelCreated', payload: channel });
      });

      connection.on('ChannelUpdated', (channel) => {
        dispatch({ type: 'chat/channelCreated', payload: channel });
      });

      connection.on('ChannelDeleted', (channelId) => {
        dispatch({ type: 'chat/channelDeleted', payload: channelId });
      });

      connection.on('ReceiveMessage', (message) => {
        dispatch({ type: 'chat/messageReceived', payload: message });
      });

      await connection.start();
      dispatch({ type: 'chat/setConnectionStatus', payload: 'connected' });
    } catch (error) {
      dispatch({ type: 'chat/setConnectionStatus', payload: 'disconnected' });
      dispatch({ type: 'chat/setError', payload: error.message || 'Failed to initialize SignalR' });
    }
  },

  stop: async () => {
    if (connection) {
      await connection.stop();
      connection = null;
      dispatch({ type: 'chat/setConnectionStatus', payload: 'disconnected' });
    }
  },

  isConnected: () => connection && connection.state === 'Connected',
};

export default signalRService;