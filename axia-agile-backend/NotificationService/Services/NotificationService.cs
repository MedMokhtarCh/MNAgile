using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Hubs;

namespace NotificationService.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(CreateNotificationDto dto);
        Task<List<NotificationDto>> GetNotificationsAsync(string userId, bool? isRead);
        Task MarkAsReadAsync(Guid id);
        Task DeleteNotificationAsync(Guid id);
    }

    public class NotificationService : INotificationService
    {
        private readonly NotificationsDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(NotificationsDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task CreateNotificationAsync(CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                SenderId = dto.SenderId,
                Type = dto.Type,
                Message = dto.Message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Metadata = dto.Metadata
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            var notificationDto = new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                SenderId = notification.SenderId,
                Type = notification.Type,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                Metadata = notification.Metadata
            };

            await _hubContext.Clients.User(notification.UserId)
                .SendAsync("ReceiveNotification", notificationDto);
        }

        public async Task<List<NotificationDto>> GetNotificationsAsync(string userId, bool? isRead)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (isRead.HasValue)
            {
                query = query.Where(n => n.IsRead == isRead.Value);
            }

            return await query
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    SenderId = n.SenderId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    Metadata = n.Metadata
                })
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteNotificationAsync(Guid id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }
    }
}