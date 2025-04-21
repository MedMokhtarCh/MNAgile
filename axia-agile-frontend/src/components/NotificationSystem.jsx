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
import { useNotification } from '../hooks/useNotifications';
import './NotificationSystem.css';

const NotificationSystem = ({ currentUser }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [fullViewMode, setFullViewMode] = useState(false);

  const { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useNotification();
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Load notifications on mount and listen for updates
  useEffect(() => {
    if (currentUser?.email) {
      fetchNotifications();

      const handleNotificationUpdate = () => {
        fetchNotifications();
      };

      window.addEventListener('newNotification', handleNotificationUpdate);
      window.addEventListener('notificationUpdated', handleNotificationUpdate);

      return () => {
        window.removeEventListener('newNotification', handleNotificationUpdate);
        window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      };
    }
  }, [currentUser, getUserNotifications]);

  const fetchNotifications = () => {
    setNotificationsLoading(true);
    setTimeout(() => {
      const userNotifications = getUserNotifications(currentUser.email);
      setNotifications(userNotifications);
      setNotificationsLoading(false);
    }, 500);
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

  const handleViewNotification = (id, metadata) => {
    markNotificationAsRead(id);
    if (metadata?.projectId) {
      if (metadata?.taskId) {
        navigate(`/project/${metadata.projectId}?task=${metadata.taskId}`);
      } else {
        navigate(`/project/${metadata.projectId}`);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(currentUser.email);
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (showOnlyUnread && notification.read) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    return true;
  });

  const displayedNotifications = fullViewMode
    ? filteredNotifications
    : filteredNotifications.slice(0, 4);

  const formatTimeDisplay = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'À l’instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 7200) return `1 heure`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} heures`;
    if (diffInSeconds < 172800) return `Hier`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
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
      case 'user': return '#ef4444';
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
      case 'user': return <FiUser size={14} />;
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
                          <Tooltip title="Tout marquer comme lu">
                            <span
                              onClick={handleMarkAllAsRead}
                              className="action-icon header-action"
                            >
                              <FiCheck size={16} />
                            </span>
                          </Tooltip>
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
                        variant={filterType === 'user' ? 'contained' : 'outlined'}
                        onClick={() => handleFilterChange('user')}
                        style={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          backgroundColor: filterType === 'user' ? '#ef4444' : 'transparent',
                          color: filterType === 'user' ? 'white' : '#ef4444',
                          borderColor: '#ef4444',
                          padding: '4px 12px',
                          fontSize: '13px',
                        }}
                        startIcon={<FiUser size={14} />}
                      >
                        Utilisateurs
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
                          className={`notification-card ${!notification.read ? 'unread' : ''}`}
                          onClick={() => handleViewNotification(notification.id, notification.metadata)}
                          style={{
                            '--notification-accent-color': getNotificationTypeColor(notification.type),
                          }}
                        >
                          <div className="notification-user">
                            <Avatar
                              className="notification-avatar"
                              style={{
                                backgroundColor: notification.read
                                  ? '#e5e7eb'
                                  : getNotificationTypeColor(notification.type) + '15',
                              }}
                            >
                              {notification.sender.avatar ? (
                                <img
                                  src={notification.sender.avatar}
                                  alt={notification.sender.name}
                                />
                              ) : (
                                getInitials(notification.sender.name)
                              )}
                            </Avatar>
                          </div>
                          <div className="notification-content">
                            <Typography variant="subtitle2" className="notification-sender">
                              {notification.sender.name}
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
                              {notification.message}
                            </Typography>
                          </div>
                          <div className="notification-meta">
                            <Typography variant="caption" className="notification-time">
                              {formatTimeDisplay(notification.timestamp)}
                            </Typography>
                            <div className="notification-actions">
                              {!notification.read && (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <FiTrash2 size={14} />
                                </span>
                              </Tooltip>
                            </div>
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