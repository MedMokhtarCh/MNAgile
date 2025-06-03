import React, { useState, useRef, useEffect } from 'react';
import {
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  Badge,
  Typography,
  Avatar,
  Tooltip,
  Box,
  Button,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiCheckCircle,
  FiMail,
  FiFileText,
  FiInfo,
  FiArrowLeft,
  FiFolderPlus,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNotification } from '../hooks/useNotifications';
import { notificationHubService } from '../services/notificationHub';
import { DateTime } from 'luxon';
import './NotificationSystem.css';

const NotificationSystem = ({ userId }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [fullViewMode, setFullViewMode] = useState(false);

  const { getNotificationsByUserId, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useNotification();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const isOwnNotifications = currentUser?.id && parseInt(userId) === currentUser.id;

  useEffect(() => {
    if (userId) {
      fetchNotifications();

      if (isOwnNotifications) {
        notificationHubService.startConnection(userId);

        const handleNotificationUpdate = () => {
          fetchNotifications();
        };

        window.addEventListener('newNotification', handleNotificationUpdate);
        window.addEventListener('notificationUpdated', handleNotificationUpdate);

        return () => {
          window.removeEventListener('newNotification', handleNotificationUpdate);
          window.removeEventListener('notificationUpdated', handleNotificationUpdate);
          notificationHubService.stopConnection();
        };
      }
    }
  }, [userId, isOwnNotifications]);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const userNotifications = await getNotificationsByUserId(userId);
      setNotifications(userNotifications);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
    setShowFilterOptions(false);
    setFullViewMode(false);
  };

  const handleCloseNotifications = (event) => {
    if (notificationRef.current && notificationRef.current.contains(event.target)) {
      return;
    }
    setNotificationsOpen(false);
    setShowFilterOptions(false);
    setFullViewMode(false);
  };

  const handleViewNotification = async (notification, e) => {
    if (e) e.stopPropagation();
    
    try {
      if (isOwnNotifications && !notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
      }
      
      if (notification.relatedEntityType === 'Project' && notification.relatedEntityId) {
        if (notification.relatedEntityType === 'Task') {
          navigate(`/project/${notification.relatedEntityId}?task=${notification.relatedEntityId}`);
        } else {
          navigate(`/project/${notification.relatedEntityId}`);
        }
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isOwnNotifications) {
      try {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Failed to mark all as read:", error);
      }
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleViewAll = () => {
    setFullViewMode(true);
  };

  const handleBackToPreview = () => {
    setFullViewMode(false);
  };

  const toggleUnreadFilter = () => {
    setShowOnlyUnread((prev) => !prev);
  };

  const toggleFilterOptions = () => {
    setShowFilterOptions((prev) => !prev);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setShowFilterOptions(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (showOnlyUnread && notification.isRead) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    return true;
  });

  const displayedNotifications = fullViewMode
    ? filteredNotifications
    : filteredNotifications.slice(0, 4);

  const formatTimeDisplay = (dateString) => {
    if (!dateString) return 'Date inconnue';

    try {
      const date = DateTime.fromISO(dateString, { zone: 'utc' });
      if (!date.isValid) return 'Date invalide';

      const now = DateTime.now().setZone('Europe/Paris');
      const diffSec = Math.round(now.diff(date, 'seconds').seconds);
      const diffMin = Math.round(diffSec / 60);
      const diffHours = Math.round(diffMin / 60);
      const diffDays = Math.round(diffHours / 24);

      if (diffSec < -5) return 'Dans le futur';
      if (diffSec < 5) return 'À l\'instant';
      if (diffSec < 60) return `Il y a ${diffSec} secondes`;
      if (diffMin < 60) return `Il y a ${diffMin} minutes`;
      if (diffHours < 24) return `Il y a ${diffHours} heures`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;

      return date.setZone('Europe/Paris').toLocaleString({
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date invalide';
    }
  };

  const getInitials = (message) => {
    const senderName = message.split(':')[0]?.trim() || '?';
    return senderName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'message': return '#2563eb';
      case 'document': return '#10b981';
      case 'system': return '#f59e0b';
      case 'project': return '#8b5cf6';
      case 'task': return '#059669';
      case 'canal': return '#ef4444';
      default: return '#2563eb';
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'message': return <FiMail size={14} />;
      case 'document': return <FiFileText size={14} />;
      case 'system': return <FiInfo size={14} />;
      case 'project': return <FiFolderPlus size={14} />;
      case 'task': return <FiCheckCircle size={14} />;
      case 'canal': return <FiUser size={14} />;
      default: return null;
    }
  };

  return (
    <div className="notification-system">
      <Tooltip title={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          className="notification-badge"
          ref={notificationRef}
          onClick={handleToggleNotifications}
        >
          <FiBell size={22} className="header-icon" />
        </Badge>
      </Tooltip>

      <Popper
        open={notificationsOpen}
        anchorEl={notificationRef.current}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
        className="notification-popper"
        style={{ zIndex: 1301 }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper elevation={3} className={`notification-paper ${fullViewMode ? 'full-view-mode' : ''}`}>
              <ClickAwayListener onClickAway={handleCloseNotifications}>
                <div>
                  <Box className="notification-header">
                    {fullViewMode && (
                      <Button
                        className="back-button"
                        onClick={handleBackToPreview}
                        startIcon={<FiArrowLeft size={16} />}
                        style={{
                          color: 'white',
                          textTransform: 'none',
                          fontSize: '14px',
                          padding: '5px 10px',
                        }}
                      >
                        Retour
                      </Button>
                    )}
                    <Typography variant="h6">
                      {fullViewMode ? 'Toutes les notifications' : 'Notifications'}
                    </Typography>
                    <div className="notification-header-actions">
                      {notifications.length > 0 && (
                        <>
                          <Tooltip title="Filtrer">
                            <span
                              onClick={toggleFilterOptions}
                              className="action-icon header-action"
                            >
                              <FiFilter size={16} />
                            </span>
                          </Tooltip>
                          <Tooltip title={showOnlyUnread ? 'Voir toutes' : 'Voir non lues seulement'}>
                            <span
                              onClick={toggleUnreadFilter}
                              className="action-icon header-action"
                            >
                              {showOnlyUnread ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </span>
                          </Tooltip>
                          {isOwnNotifications && (
                            <Tooltip title="Tout marquer comme lu">
                              <span
                                onClick={handleMarkAllAsRead}
                                className="action-icon header-action"
                              >
                                <FiCheck size={16} />
                              </span>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </Box>

                  <Fade in={showFilterOptions}>
                    <Box
                      className="notification-filters"
                      style={{
                        display: showFilterOptions ? 'flex' : 'none',
                        padding: '10px 16px',
                        gap: '8px',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <Button
                        size="small"
                        variant={filterType === 'all' ? 'contained' : 'outlined'}
                        onClick={() => handleFilterChange('all')}
                        style={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          backgroundColor: filterType === 'all' ? '#2563eb' : 'transparent',
                          color: filterType === 'all' ? 'white' : '#2563eb',
                          borderColor: '#2563eb',
                          padding: '4px 12px',
                          fontSize: '13px',
                        }}
                      >
                        Tous
                      </Button>
                      <Button
                        size="small"
                        variant={filterType === 'project' ? 'contained' : 'outlined'}
                        onClick={() => handleFilterChange('project')}
                        style={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          backgroundColor: filterType === 'project' ? '#8b5cf6' : 'transparent',
                          color: filterType === 'project' ? 'white' : '#8b5cf6',
                          borderColor: '#8b5cf6',
                          padding: '4px 12px',
                          fontSize: '13px',
                        }}
                        startIcon={<FiFolderPlus size={14} />}
                      >
                        Projets
                      </Button>
                      <Button
                        size="small"
                        variant={filterType === 'task' ? 'contained' : 'outlined'}
                        onClick={() => handleFilterChange('task')}
                        style={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          backgroundColor: filterType === 'task' ? '#059669' : 'transparent',
                          color: filterType === 'task' ? 'white' : '#059669',
                          borderColor: '#059669',
                          padding: '4px 12px',
                          fontSize: '13px',
                        }}
                        startIcon={<FiCheckCircle size={14} />}
                      >
                        Tâches
                      </Button>
                      <Button
                        size="small"
                        variant={filterType === 'canal' ? 'contained' : 'outlined'}
                        onClick={() => handleFilterChange('canal')}
                        style={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          backgroundColor: filterType === 'canal' ? '#ef4444' : 'transparent',
                          color: filterType === 'canal' ? 'white' : '#ef4444',
                          borderColor: '#ef4444',
                          padding: '4px 12px',
                          fontSize: '13px',
                        }}
                        startIcon={<FiUser size={14} />}
                      >
                        Canal
                      </Button>
                    </Box>
                  </Fade>

                  <div className="notification-list fixed-height">
                    {notificationsLoading ? (
                      <Box className="notification-loading">
                        <CircularProgress size={28} className="notification-loader" />
                      </Box>
                    ) : displayedNotifications.length > 0 ? (
                      displayedNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                          onClick={(e) => handleViewNotification(notification, e)}
                          style={{
                            '--notification-accent-color': getNotificationTypeColor(notification.type),
                          }}
                        >
                          <div className="notification-user">
                            <Avatar
                              className="notification-avatar"
                              style={{
                                backgroundColor: notification.isRead
                                  ? '#e5e7eb'
                                  : getNotificationTypeColor(notification.type) + '15',
                              }}
                            >
                              {getInitials(notification.message)}
                            </Avatar>
                          </div>
                          <div className="notification-content">
                            <Typography variant="subtitle2" className="notification-sender">
                              {notification.message.split(':')[0]?.trim()}
                              <span
                                style={{
                                  marginLeft: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: getNotificationTypeColor(notification.type),
                                  fontSize: '12px',
                                  opacity: 0.85,
                                }}
                              >
                                {getNotificationTypeIcon(notification.type)}
                                <span style={{ marginLeft: '4px' }}>
                                  {notification.type === 'project'
                                    ? 'Projet'
                                    : notification.type === 'task'
                                    ? 'Tâche'
                                    : notification.type}
                                </span>
                              </span>
                            </Typography>
                            <Typography variant="body2" className="notification-message">
                              {notification.message.split(':').slice(1).join(':').trim()}
                            </Typography>
                          </div>
                          <div className="notification-meta">
                            <Typography variant="caption" className="notification-time">
                              {formatTimeDisplay(notification.createdAt)}
                            </Typography>
                            {isOwnNotifications && (
                              <div className="notification-actions">
                                {!notification.isRead && (
                                  <Tooltip title="Marquer comme lu">
                                    <span
                                      className="action-icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(notification.id);
                                      }}
                                    >
                                      <FiCheckCircle size={14} />
                                    </span>
                                  </Tooltip>
                                )}
                                <Tooltip title="Supprimer">
                              <span
  className="action-icon"
  onClick={(e) => handleDeleteNotification(notification.id, e)}
>
  <FiTrash2 size={14} />
</span>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <Box className="notification-empty">
                        <Typography variant="body2">
                          {showOnlyUnread
                            ? 'Aucune notification non lue'
                            : filterType !== 'all'
                            ? `Aucune notification de type ${filterType}`
                            : 'Vous n\'avez pas de notifications'}
                        </Typography>
                      </Box>
                    )}
                  </div>

                  <Box className="notification-footer">
                    {!fullViewMode && notifications.length > 0 ? (
                      <Button
                        className="view-all-button"
                        onClick={handleViewAll}
                        fullWidth
                      >
                        Voir toutes les notifications ({filteredNotifications.length})
                      </Button>
                    ) : (
                      fullViewMode && (
                        <Typography variant="body2" className="notification-count-text">
                          {filteredNotifications.length} notification
                          {filteredNotifications.length !== 1 ? 's' : ''}
                        </Typography>
                      )
                    )}
                  </Box>
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default NotificationSystem;