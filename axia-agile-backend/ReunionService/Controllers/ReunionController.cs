using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReunionService.DTOs;
using ReunionService.Services;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ReunionService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReunionController : ControllerBase
    {
        private readonly ReunionService.Services.ReunionService _reunionService;
        private readonly ILogger<ReunionController> _logger;

        public ReunionController(ReunionService.Services.ReunionService reunionService, ILogger<ReunionController> logger)
        {
            _reunionService = reunionService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateMeetings")]
        public async Task<IActionResult> CreateReunion([FromBody] CreateReunionRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Title) || request.StartTime == default || request.EndTime == default)
            {
                _logger.LogWarning("Invalid reunion request: Title, StartTime, and EndTime are required.");
                return BadRequest("Le titre, la date de début et la date de fin de la réunion sont requis.");
            }

            try
            {
                var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("No valid userId found in token claims");
                    return Unauthorized("Utilisateur non authentifié.");
                }

                _logger.LogInformation("Creating Google Meet reunion for user: {UserId}", userId);
                var reunion = await _reunionService.CreateReunionAsync(userId, request.Title, request.StartTime, request.EndTime);

                _logger.LogInformation("Reunion created successfully: {MeetingUri}", reunion.MeetingUri);
                return Ok(new ReunionDTO
                {
                    Id = reunion.Id,
                    Title = reunion.Title,
                    MeetingUri = reunion.MeetingUri,
                    StartTime = reunion.StartTime,
                    EndTime = reunion.EndTime,
                    CalendarEventId = reunion.CalendarEventId,
                    CreatedByUserId = reunion.CreatedByUserId,
                    CreatedAt = reunion.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reunion");
                return StatusCode(500, new { message = "Erreur lors de la création de la réunion.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetReunions()
        {
            try
            {
                var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("No valid userId found in token claims");
                    return Unauthorized("Utilisateur non authentifié.");
                }

                var reunions = await _reunionService.GetReunionsByUserAsync(userId);
                var reunionDTOs = reunions.Select(r => new ReunionDTO
                {
                    Id = r.Id,
                    Title = r.Title,
                    MeetingUri = r.MeetingUri,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                    CalendarEventId = r.CalendarEventId,
                    CreatedByUserId = r.CreatedByUserId,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return Ok(reunionDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reunions");
                return StatusCode(500, new { message = "Erreur lors de la récupération des réunions.", error = ex.Message });
            }
        }
    }
}