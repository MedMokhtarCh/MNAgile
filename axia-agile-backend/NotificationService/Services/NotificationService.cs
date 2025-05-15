using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Models;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            AppDbContext context,
            ILogger<NotificationService> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        }

        public async Task<NotificationDTO> CreateNotificationAsync(
            string recipientEmail,
            string senderName,
            string message,
            string type,
            MetadataDTO metadata = null)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail))
                throw new ArgumentException("Recipient email cannot be null or empty.", nameof(recipientEmail));
            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Message cannot be null or empty.", nameof(message));
            if (string.IsNullOrWhiteSpace(type))
                throw new ArgumentException("Notification type cannot be null or empty.", nameof(type));

            try
            {
                var notification = new Notification
                {
                    RecipientEmail = recipientEmail,
                    SenderName = senderName ?? "System",
                    Message = message,
                    Type = type,
                    Read = false,
                    Timestamp = DateTime.UtcNow,
                    Metadata = metadata != null ? JsonSerializer.Serialize(metadata, new JsonSerializerOptions { IgnoreNullValues = true }) : null
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                var notificationDto = MapToDto(notification);

                // Broadcast notification to the recipient's group
                await _hubContext.Clients.Group(recipientEmail)
                    .SendAsync("ReceiveNotification", notificationDto);

                _logger.LogInformation($"Notification created and broadcasted for {recipientEmail}: {message}");

                return notificationDto;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"Error serializing metadata for notification to {recipientEmail}");
                throw new InvalidOperationException("Failed to serialize notification metadata.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating notification for {recipientEmail}");
                throw;
            }
        }

        public async Task<List<NotificationDTO>> GetUserNotificationsAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));

            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.RecipientEmail == email)
                    .OrderByDescending(n => n.Timestamp)
                    .ToListAsync();

                return notifications.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving notifications for {email}");
                throw;
            }
        }

        public async Task MarkNotificationAsReadAsync(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    throw new InvalidOperationException($"Notification with ID {id} not found.");
                }

                if (!notification.Read)
                {
                    notification.Read = true;
                    _context.Notifications.Update(notification);
                    await _context.SaveChangesAsync();

                    // Notify client of updated notification
                    await _hubContext.Clients.Group(notification.RecipientEmail)
                        .SendAsync("NotificationUpdated", MapToDto(notification));

                    _logger.LogInformation($"Notification {id} marked as read for {notification.RecipientEmail}.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {id} as read");
                throw;
            }
        }

        public async Task MarkAllNotificationsAsReadAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));

            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.RecipientEmail == email && !n.Read)
                    .ToListAsync();

                if (notifications.Any())
                {
                    foreach (var notification in notifications)
                    {
                        notification.Read = true;
                    }

                    _context.Notifications.UpdateRange(notifications);
                    await _context.SaveChangesAsync();

                    // Notify client of updated notifications
                    await _hubContext.Clients.Group(email)
                        .SendAsync("NotificationsUpdated", notifications.Select(MapToDto).ToList());

                    _logger.LogInformation($"Marked {notifications.Count} notifications as read for {email}.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking all notifications as read for {email}");
                throw;
            }
        }

        public async Task DeleteNotificationAsync(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    throw new InvalidOperationException($"Notification with ID {id} not found.");
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                // Notify client of deleted notification
                await _hubContext.Clients.Group(notification.RecipientEmail)
                    .SendAsync("NotificationDeleted", id);

                _logger.LogInformation($"Notification {id} deleted for {notification.RecipientEmail}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting notification {id}");
                throw;
            }
        }

        private NotificationDTO MapToDto(Notification notification)
        {
            MetadataDTO metadata = null;
            if (!string.IsNullOrEmpty(notification.Metadata))
            {
                try
                {
                    metadata = JsonSerializer.Deserialize<MetadataDTO>(notification.Metadata);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, $"Failed to deserialize metadata for notification {notification.Id}");
                }
            }

            return new NotificationDTO
            {
                Id = notification.Id,
                RecipientEmail = notification.RecipientEmail,
                Sender = new SenderDTO
                {
                    Name = notification.SenderName,
                    Avatar = null
                },
                Message = notification.Message,
                Type = notification.Type,
                Read = notification.Read,
                Timestamp = notification.Timestamp,
                Metadata = metadata
            };
        }
    }
}