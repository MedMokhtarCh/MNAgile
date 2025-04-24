using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfileService.DTOs;
using ProfileService.Services;
using System.Security.Claims;

namespace ProfileService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly Services.ProfileService _profileService;
        private readonly ILogger<ProfileController> _logger;
        private readonly object userId;

        public ProfileController(Services.ProfileService profileService, ILogger<ProfileController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ProfileDTO>> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation($"Retrieving profile for UserId: {userId}");
                var profile = await _profileService.GetProfileByUserIdAsync(userId);
                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Error retrieving profile: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error retrieving profile: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpPut]
        public async Task<ActionResult<ProfileDTO>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation($"Updating profile for UserId: {userId}");
                var profile = await _profileService.UpdateProfileAsync(userId, request);
                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Error updating profile: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error updating profile: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpPatch("password")]
        public async Task<ActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation($"Updating password for UserId: {userId}");
                await _profileService.UpdatePasswordAsync(userId, request.NewPassword);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Error updating password: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error updating password: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpPost("photo")]
        public async Task<ActionResult<ProfileDTO>> UploadProfilePhoto(IFormFile file)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning($"No file provided for UserId: {userId}");
                    return BadRequest("Aucun fichier sélectionné.");
                }

                _logger.LogInformation($"Uploading profile photo for UserId: {userId}");
                var profile = await _profileService.UploadProfilePhotoAsync(userId, file);
                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Error uploading photo for UserId: {userId}: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error uploading photo for UserId: {userId}: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogError("Unable to retrieve UserId from JWT token.");
                throw new UnauthorizedAccessException("Utilisateur non authentifié.");
            }
            return userId;
        }
    }

 

    public class UpdatePasswordRequest
    {
        public string NewPassword { get; set; }
    }
}