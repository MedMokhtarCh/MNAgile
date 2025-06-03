using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Hubs;

namespace NotificationService.Services
{
    public class NotificationService
    {
        private readonly NotificationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Dictionary<int, UserDTO> _userCache;

        public NotificationService(
            NotificationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<NotificationService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _hubContext = hubContext;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _userCache = new Dictionary<int, UserDTO>();
        }

        private async Task<UserDTO> GetUserAsync(int userId)
        {
            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID {UserId} provided.", userId);
                throw new KeyNotFoundException($"Invalid user ID {userId}.");
            }

            if (_userCache.TryGetValue(userId, out var cachedUser))
            {
                return cachedUser;
            }

            var client = _httpClientFactory.CreateClient();
            var userServiceUrl = _configuration["UserService:BaseUrl"]
                ?? throw new InvalidOperationException("UserService:BaseUrl is not configured.");
            var request = new HttpRequestMessage(HttpMethod.Get, $"{userServiceUrl}/api/users/{userId}");

            // Get token from cookie instead of Authorization header
            var token = _httpContextAccessor.HttpContext?.Request.Cookies["jwtToken"]; // Adjust "jwtToken" to match your cookie name
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new KeyNotFoundException($"User {userId} not found in UserService.");
                }
                throw new HttpRequestException($"Failed to fetch user {userId} from UserService: {response.ReasonPhrase}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var user = JsonSerializer.Deserialize<UserDTO>(content);
            if (user == null)
            {
                throw new KeyNotFoundException($"User {userId} returned null from UserService.");
            }
            _userCache[userId] = user;
            if (_userCache.Count > 1000)
            {
                _userCache.Clear();
            }
            _logger.LogInformation("Fetched user {UserId} from UserService.", userId);
            return user;
        }
        public async Task<NotificationDTO> CreateNotificationAsync(CreateNotificationRequest request)
        {
            if (request.UserId <= 0)
            {
                throw new ArgumentException("Invalid user ID.");
            }
            if (string.IsNullOrEmpty(request.Type))
            {
                throw new ArgumentException("Notification type is required.");
            }
            if (string.IsNullOrEmpty(request.Message))
            {
                throw new ArgumentException("Notification message is required.");
            }

            _logger.LogInformation("Creating notification for user {UserId}, type: {Type}", request.UserId, request.Type);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var notification = new Notification
                {
                    UserId = request.UserId,
                    SenderId = request.SenderId,
                    Type = request.Type,
                    Message = request.Message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = request.RelatedEntityType,
                    RelatedEntityId = request.RelatedEntityId
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                var notificationDTO = new NotificationDTO
                {
                    Id = notification.Id,
                    UserId = notification.UserId,
                    SenderId = notification.SenderId,
                    Type = notification.Type,
                    Message = notification.Message,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt,
                    RelatedEntityType = notification.RelatedEntityType,
                    RelatedEntityId = notification.RelatedEntityId
                };

                await transaction.CommitAsync();

                await _hubContext.Clients.Group($"user_{request.UserId}").SendAsync("ReceiveNotification", notificationDTO);

                _logger.LogInformation("Notification {NotificationId} created for user {UserId}.", notification.Id, request.UserId);
                return notificationDTO;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to create notification for user {UserId}.", request.UserId);
                throw;
            }
        }
        public async Task<List<NotificationDTO>> GetUserNotificationsAsync(int userId)
        {
            _logger.LogInformation("Fetching notifications for user {UserId}.", userId);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDTO
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedEntityType = n.RelatedEntityType,
                    RelatedEntityId = n.RelatedEntityId
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved {NotificationCount} notifications for user {UserId}.", notifications.Count, userId);
            return notifications;
        }

        public async Task<NotificationDTO> GetNotificationByIdAsync(int notificationId, int userId)
        {
            _logger.LogInformation("Fetching notification {NotificationId} for user {UserId}.", notificationId, userId);

            var notification = await _context.Notifications
                .Where(n => n.Id == notificationId && n.UserId == userId)
                .Select(n => new NotificationDTO
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedEntityType = n.RelatedEntityType,
                    RelatedEntityId = n.RelatedEntityId
                })
                .FirstOrDefaultAsync();

            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found or not owned by user.");
            }

            return notification;
        }

        public async Task<List<NotificationDTO>> GetUserNotificationsByTypeAsync(int userId, string type)
        {
            if (string.IsNullOrEmpty(type))
            {
                throw new ArgumentException("Notification type is required.");
            }

            _logger.LogInformation("Fetching notifications of type {Type} for user {UserId}.", type, userId);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.Type == type)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDTO
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedEntityType = n.RelatedEntityType,
                    RelatedEntityId = n.RelatedEntityId
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved {NotificationCount} notifications of type {Type} for user {UserId}.", notifications.Count, type, userId);
            return notifications;
        }

        public async Task MarkNotificationAsReadAsync(int notificationId, int userId)
        {
            _logger.LogInformation("Marking notification {NotificationId} as read for user {UserId}.", notificationId, userId);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found or not owned by user.");
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} marked as read for user {UserId}.", notificationId, userId);

            await _hubContext.Clients.Group($"user_{userId}").SendAsync("NotificationsUpdated");
        }

        public async Task MarkAllNotificationsAsReadAsync(int userId)
        {
            _logger.LogInformation("Marking all notifications as read for user {UserId}.", userId);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!notifications.Any())
            {
                _logger.LogInformation("No unread notifications found for user {UserId}.", userId);
                return;
            }

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("All notifications marked as read for user {UserId}.", userId);

            await _hubContext.Clients.Group($"user_{userId}").SendAsync("NotificationsUpdated");
        }

        public async Task DeleteNotificationAsync(int notificationId, int userId)
        {
            _logger.LogInformation("Deleting notification {NotificationId} for user {UserId}.", notificationId, userId);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found or not owned by user.");
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} deleted for user {UserId}.", notificationId, userId);

            await _hubContext.Clients.Group($"user_{userId}").SendAsync("NotificationsUpdated");
        }

        public async Task DeleteAllUserNotificationsAsync(int userId)
        {
            _logger.LogInformation("Deleting all notifications for user {UserId}.", userId);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();

            if (!notifications.Any())
            {
                _logger.LogInformation("No notifications found for user {UserId}.", userId);
                return;
            }

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("All notifications deleted for user {UserId}.", userId);

            await _hubContext.Clients.Group($"user_{userId}").SendAsync("NotificationsUpdated");
        }
    
    public async Task<List<NotificationDTO>> GetAllNotificationsAsync()
        {
            _logger.LogInformation("Fetching all notifications.");

            var notifications = await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDTO
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedEntityType = n.RelatedEntityType,
                    RelatedEntityId = n.RelatedEntityId
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved {NotificationCount} notifications.", notifications.Count);
            return notifications;
        }
    } }