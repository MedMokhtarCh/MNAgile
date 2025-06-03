using System.Security.Claims;
using DiscussionService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        [Authorize(Policy = "CanCommunicate")]
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
        [Authorize(Policy = "CanCreateChannel")]
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
        [Authorize(Policy = "CanCommunicate")]
        public async Task<ActionResult<MessageDTO>> SendMessage(
        [FromForm] SendMessageRequest request,
        [FromForm] List<IFormFile> files) // Ajout de [FromForm] ici
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            try
            {
                var message = await _discussionService.SendMessageAsync(request, userId, files ?? new List<IFormFile>());
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
        [Authorize(Policy = "CanCommunicate")]

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
        [Authorize(Policy = "CanCreateChannel")]
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
        [HttpGet("files/{fileName}")]
        [Authorize(Policy = "CanCommunicate")]
        public async Task<IActionResult> GetFile(string fileName)
        {
            try
            {
                // Valider le nom du fichier pour la sécurité
                if (string.IsNullOrEmpty(fileName))
                    return BadRequest(new { message = "Nom de fichier invalide." });

                // Chemin sécurisé vers le dossier uploads
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                var filePath = Path.Combine(uploadsPath, fileName);

                // Vérifier que le fichier existe
                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "Fichier introuvable." });

                // Lire le fichier
                var fileStream = System.IO.File.OpenRead(filePath);

                // Déterminer le type de contenu
                var contentType = GetContentType(fileName);

                // Retourner le fichier avec option de téléchargement
                return File(fileStream, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving file {FileName}", fileName);
                return StatusCode(500, new { message = "Erreur lors de la récupération du fichier." });
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".csv" => "text/csv",
                ".zip" => "application/zip",
                _ => "application/octet-stream" // Type par défaut pour téléchargement forcé
            };
        }

        [HttpPut("channels/{channelId}")]
        [Authorize(Policy = "CanCreateChannel")]
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