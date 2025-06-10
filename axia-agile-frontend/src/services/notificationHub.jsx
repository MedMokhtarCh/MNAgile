import * as signalR from '@microsoft/signalr';
import { store } from '../store';
import { addNotification, fetchNotifications } from '../store/slices/notificationSlice';

class NotificationHubService {
  constructor() {
    this.connection = null;
  }

  async startConnection(userId) {
    if (!userId) {
      console.error('User ID missing for SignalR connection');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7147/hubs/notification?userId=${userId}`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (notification) => {
      // Map backend NotificationDTO to frontend 
      const mappedNotification = {
        ...notification,
        read: notification.isRead, 
        timestamp: notification.createdAt, 
        metadata: {
          projectId: notification.relatedEntityType === 'Project' ? notification.relatedEntityId : null,
          taskId: notification.relatedEntityType === 'Task' ? notification.relatedEntityId : null,
          channelId: notification.relatedEntityType === 'Channel' ? notification.relatedEntityId : null,
    
        },
      };

      // Add to Redux store
      store.dispatch(addNotification(mappedNotification));

      // Trigger local event
      const event = new Event('newNotification');
      window.dispatchEvent(event);
    });

    this.connection.on('NotificationsUpdated', () => {
      // Fetch from backend and update Redux store
      store.dispatch(fetchNotifications({ type: null }));

      // Trigger local event
      const event = new Event('notificationUpdated');
      window.dispatchEvent(event);
    });

    try {
      await this.connection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('SignalR connection failed:', error);
    }
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR connection stopped');
    }
  }
}

export const notificationHubService = new NotificationHubService();