using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotificationService.DTOs;
using NotificationService.Services;

namespace NotificationService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly Services.NotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(Services.NotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<NotificationDTO>>> GetUserNotifications([FromQuery] string? type = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                List<NotificationDTO> notifications;
                if (!string.IsNullOrEmpty(type))
                {
                    notifications = await _notificationService.GetUserNotificationsByTypeAsync(userId, type);
                }
                else
                {
                    notifications = await _notificationService.GetUserNotificationsAsync(userId);
                }
                return Ok(notifications);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request for notifications for user {UserId}", userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching notifications for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la récupération des notifications.", error = ex.Message });
            }
        }

        [HttpGet("{notificationId}")]
        public async Task<ActionResult<NotificationDTO>> GetNotificationById(int notificationId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                var notification = await _notificationService.GetNotificationByIdAsync(notificationId, userId);
                return Ok(notification);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Notification {NotificationId} not found for user {UserId}", notificationId, userId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching notification {NotificationId} for user {UserId}", notificationId, userId);
                return StatusCode(500, new { message = "Erreur lors de la récupération de la notification.", error = ex.Message });
            }
        }

        [HttpPut("read-all")]
        public async Task<ActionResult> MarkAllNotificationsAsRead()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                await _notificationService.MarkAllNotificationsAsReadAsync(userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la mise à jour des notifications.", error = ex.Message });
            }
        }

        [HttpPut("{notificationId}/read")]
        public async Task<ActionResult> MarkNotificationAsRead(int notificationId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                await _notificationService.MarkNotificationAsReadAsync(notificationId, userId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation for notification {NotificationId} by user {UserId}", notificationId, userId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}", notificationId, userId);
                return StatusCode(500, new { message = "Erreur lors de la mise à jour de la notification.", error = ex.Message });
            }
        }

        [HttpDelete("{notificationId}")]
        public async Task<ActionResult> DeleteNotification(int notificationId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                await _notificationService.DeleteNotificationAsync(notificationId, userId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Notification {NotificationId} not found for user {UserId}", notificationId, userId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId} for user {UserId}", notificationId, userId);
                return StatusCode(500, new { message = "Erreur lors de la suppression de la notification.", error = ex.Message });
            }
        }

        [HttpDelete("user-notifications")]
        public async Task<ActionResult> DeleteAllUserNotifications()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            try
            {
                await _notificationService.DeleteAllUserNotificationsAsync(userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all notifications for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la suppression des notifications.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<NotificationDTO>> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            var senderIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(senderIdClaim, out var senderId))
            {
                return Unauthorized(new { message = "Sender ID not found in token." });
            }

            try
            {
                request.SenderId = senderId;
                var notification = await _notificationService.CreateNotificationAsync(request);
                return CreatedAtAction(nameof(GetUserNotifications), new { id = notification.Id }, notification);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid notification creation request");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, new { message = "Erreur lors de la création de la notification.", error = ex.Message });
            }

        }
        [HttpGet("by-user/{userId}")]
        public async Task<ActionResult<List<NotificationDTO>>> GetNotificationsByUserId(int userId, [FromQuery] DateTime? fromDate = null)
        {
            try
            {
                var notifications = await _notificationService.GetUserNotificationsAsync(userId);

                // Filtrer par date si le paramètre fromDate est fourni
                if (fromDate.HasValue)
                {
                    notifications = notifications.Where(n => n.CreatedAt >= fromDate.Value).ToList();
                }

                // Ordonner par date de création décroissante
                notifications = notifications.OrderByDescending(n => n.CreatedAt).ToList();

                return Ok(notifications);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request for notifications for user {UserId}", userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching notifications for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la récupération des notifications.", error = ex.Message });
            }
        }

    }
}