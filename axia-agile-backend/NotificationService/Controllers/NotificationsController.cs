using Microsoft.AspNetCore.Mvc;
using NotificationService.DTOs;
using NotificationService.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace NotificationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly Services. NotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            Services.NotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet("user/{email}")]
        [ProducesResponseType(typeof(List<NotificationDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<NotificationDTO>>> GetUserNotifications(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogWarning("GetUserNotifications: Email is null or empty.");
                return BadRequest("Email is required.");
            }

            try
            {
                var notifications = await _notificationService.GetUserNotificationsAsync(email);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving notifications for {email}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving notifications.");
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(NotificationDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<NotificationDTO>> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RecipientEmail) || string.IsNullOrWhiteSpace(request.Message))
            {
                _logger.LogWarning("CreateNotification: Invalid request data.");
                return BadRequest("RecipientEmail and Message are required.");
            }

            try
            {
                var notification = await _notificationService.CreateNotificationAsync(
                    request.RecipientEmail,
                    request.SenderName ?? "System",
                    request.Message,
                    request.Type ?? "General",
                    request.Metadata
                );

                return CreatedAtAction(nameof(GetUserNotifications), new { email = notification.RecipientEmail }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating notification for {request.RecipientEmail}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while creating the notification.");
            }
        }

        [HttpPut("{id}/read")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> MarkNotificationAsRead(int id)
        {
            try
            {
                await _notificationService.MarkNotificationAsReadAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, $"Notification {id} not found");
                return NotFound("Notification not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {id} as read");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while marking the notification as read.");
            }
        }

        [HttpPut("user/{email}/read-all")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> MarkAllNotificationsAsRead(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogWarning("MarkAllNotificationsAsRead: Email is null or empty.");
                return BadRequest("Email is required.");
            }

            try
            {
                await _notificationService.MarkAllNotificationsAsReadAsync(email);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking all notifications as read for {email}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while marking all notifications as read.");
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            try
            {
                await _notificationService.DeleteNotificationAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, $"Notification {id} not found");
                return NotFound("Notification not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting notification {id}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while deleting the notification.");
            }
        }
    }
}