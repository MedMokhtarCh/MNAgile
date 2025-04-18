
import { useCallback } from 'react';

export const useNotification = () => {
 
  const createNotification = useCallback(
    ({
      recipient,
      type = 'general', // 'project', 'task', 'user'
      message,
      sender = { name: 'Système', avatar: null },
      metadata = {},
    }) => {
      const notification = {
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        type,
        sender,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        recipient, 
        metadata, // { projectId, taskId }
      };

      const storedNotifications =
        JSON.parse(localStorage.getItem('notifications')) || [];
      storedNotifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(storedNotifications));

      // Trigger event for real-time updates
      const event = new Event('newNotification');
      window.dispatchEvent(event);
    },
    []
  );

  // Mark a notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    const storedNotifications =
      JSON.parse(localStorage.getItem('notifications')) || [];
    const updatedNotifications = storedNotifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    const event = new Event('notificationUpdated');
    window.dispatchEvent(event);
  }, []);

  // Mark all notifications for a user as read
  const markAllNotificationsAsRead = useCallback((userEmail) => {
    const storedNotifications =
      JSON.parse(localStorage.getItem('notifications')) || [];
    const updatedNotifications = storedNotifications.map((notif) =>
      notif.recipient === userEmail ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    const event = new Event('notificationUpdated');
    window.dispatchEvent(event);
  }, []);

  // Delete a notification
  const deleteNotification = useCallback((notificationId) => {
    const storedNotifications =
      JSON.parse(localStorage.getItem('notifications')) || [];
    const updatedNotifications = storedNotifications.filter(
      (notif) => notif.id !== notificationId
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    const event = new Event('notificationUpdated');
    window.dispatchEvent(event);
  }, []);

  // Get notifications for a user
  const getUserNotifications = useCallback((userEmail) => {
    const storedNotifications =
      JSON.parse(localStorage.getItem('notifications')) || [];
    return storedNotifications
      .filter((notif) => notif.recipient === userEmail)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, []);

  return {
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getUserNotifications,
  };
};