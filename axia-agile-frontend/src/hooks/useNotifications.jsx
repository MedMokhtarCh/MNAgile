import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateTime } from 'luxon';
import {
  createNotification as createNotificationThunk,
  fetchNotifications,
  fetchNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../store/slices/notificationSlice';

export const useNotification = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);

  const createNotification = useCallback(
    async ({
      userId, // Recipient's userId (required)
      type = 'general', // 'project', 'task', 'user', 'system'
      message,
      relatedEntityType, // e.g., 'Project', 'Task'
      relatedEntityId,
      createdAt, // Optional: provided by caller or set to current UTC time
    }) => {
      if (!userId) {
        console.error('Recipient userId is required');
        return;
      }
      if (!currentUser) {
        console.error('Current user not found');
        return;
      }

      // Construct message with current user's first and last name
      const senderName = `${currentUser.firstName} ${currentUser.lastName}`;
      const notificationMessage = message
        ? `${senderName}: ${message}`
        : `${senderName} vous a assigné à un élément`;

      // Set createdAt to current UTC time if not provided
      const notificationCreatedAt = createdAt || DateTime.now().toUTC().toISO();

      // Dispatch to backend
      try {
        await dispatch(
          createNotificationThunk({
            userId,
            type,
            message: notificationMessage,
            relatedEntityType,
            relatedEntityId,
            createdAt: notificationCreatedAt,
          })
        ).unwrap();
        console.log('Notification created with createdAt:', notificationCreatedAt);
      } catch (error) {
        console.error('Failed to create notification in backend:', error);
      }
    },
    [currentUser, dispatch]
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        await dispatch(markNotificationAsRead(notificationId)).unwrap();
      } catch (error) {
        console.error('Failed to mark notification as read in backend:', error);
      }
    },
    [dispatch]
  );

  const markAllNotificationsAsRead = useCallback(
    async () => {
      try {
        await dispatch(markAllNotificationsAsRead()).unwrap();
      } catch (error) {
        console.error('Failed to mark all notifications as read in backend:', error);
      }
    },
    [dispatch]
  );

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await dispatch(deleteNotification(notificationId)).unwrap();
      } catch (error) {
        console.error('Failed to delete notification in backend:', error);
      }
    },
    [dispatch]
  );

  const getUserNotifications = useCallback(
    async (type = null) => {
      try {
        const response = await dispatch(fetchNotifications({ type })).unwrap();
        console.log('Fetched notifications:', response);
        return response;
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    [dispatch]
  );

  const getNotificationsByUserId = useCallback(
    async (userId, type = null) => {
      if (!userId) {
        console.error('User ID is required');
        return [];
      }
      try {
        const response = await dispatch(fetchNotificationsByUserId({ userId, type })).unwrap();
        console.log('Fetched notifications for user:', response);
        return response;
      } catch (error) {
        console.error('Failed to fetch notifications for user:', error);
        return [];
      }
    },
    [dispatch]
  );

  const syncNotifications = useCallback(
    (userId) => {
      if (userId) {
        dispatch(fetchNotificationsByUserId({ userId, type: null }));
      } else {
        dispatch(fetchNotifications({ type: null }));
      }
    },
    [dispatch]
  );

  return {
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getUserNotifications,
    getNotificationsByUserId,
    syncNotifications,
  };
};