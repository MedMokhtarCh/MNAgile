using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using DiscussionService.DTOs;
using DiscussionService.Services;

namespace DiscussionService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DiscussionController : ControllerBase
    {
        private readonly Services.DiscussionService _discussionService;
        private readonly ILogger<DiscussionController> _logger;

        public DiscussionController(Services.DiscussionService discussionService, ILogger<DiscussionController> logger)
        {
            _discussionService = discussionService;
            _logger = logger;
        }

        [HttpGet("channels")]
        public async Task<ActionResult<List<ChannelDTO>>> GetChannels()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var channels = await _discussionService.GetUserChannelsAsync(userId);
                return Ok(channels);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching channels for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la récupération des canaux.", error = ex.Message });
            }
        }

        [HttpPost("channels")]
        public async Task<ActionResult<ChannelDTO>> CreateChannel([FromBody] CreateChannelRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var channel = await _discussionService.CreateChannelAsync(request, userId);
                return CreatedAtAction(nameof(GetChannels), new { id = channel.Id }, channel);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid channel creation request by user {UserId}", userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating channel for user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de la création du canal.", error = ex.Message });
            }
        }

        [HttpPost("messages")]
        public async Task<ActionResult<MessageDTO>> SendMessage([FromForm] SendMessageRequest request, List<IFormFile> files)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var message = await _discussionService.SendMessageAsync(request, userId, files);
                return Ok(message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access by user {UserId}", userId);
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message by user {UserId}", userId);
                return StatusCode(500, new { message = "Erreur lors de l'envoi du message.", error = ex.Message });
            }
        }

        [HttpGet("channels/{channelId}/messages")]
        public async Task<ActionResult<List<MessageDTO>>> GetChannelMessages(int channelId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var messages = await _discussionService.GetChannelMessagesAsync(channelId, userId);
                return Ok(messages);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access by user {UserId} to channel {ChannelId}", userId, channelId);
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching messages for channel {ChannelId} by user {UserId}", channelId, userId);
                return StatusCode(500, new { message = "Erreur lors de la récupération des messages.", error = ex.Message });
            }
        }
        [HttpDelete("channels/{channelId}")]
        public async Task<ActionResult> DeleteChannel(int channelId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                await _discussionService.DeleteChannelAsync(channelId, userId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized attempt to delete channel {ChannelId} by user {UserId}", channelId, userId);
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation for channel {ChannelId} by user {UserId}", channelId, userId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting channel {ChannelId} by user {UserId}", channelId, userId);
                return StatusCode(500, new { message = "Erreur lors de la suppression du canal.", error = ex.Message });
            }
        }

        [HttpPut("channels/{channelId}")]
        public async Task<ActionResult<ChannelDTO>> UpdateChannel(int channelId, [FromBody] UpdateChannelRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var updatedChannel = await _discussionService.UpdateChannelAsync(channelId, request, userId);
                return Ok(updatedChannel);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized attempt to update channel {ChannelId} by user {UserId}", channelId, userId);
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation for channel {ChannelId} by user {UserId}", channelId, userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid update request for channel {ChannelInId} by user {UserId}", channelId, userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating channel {ChannelId} by user {UserId}", channelId, userId);
                return StatusCode(500, new { message = "Erreur lors de la mise à jour du canal.", error = ex.Message });
            }
        }
    }
}