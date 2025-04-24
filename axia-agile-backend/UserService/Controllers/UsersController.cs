using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.DTOs;
using UserService.Models;


namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly Services.UserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(Services.UserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateUsers")]

        public async Task<ActionResult<UserDTO>> CreateUser([FromBody] CreateUserRequest request)
        {
            _logger.LogInformation("Received create user request: {@Request}", request);

            if (request == null)
            {
                _logger.LogWarning("Create user request is null");
                return BadRequest("Les données utilisateur sont requises.");
            }

            // Vérifier si l'email existe déjà
            if (await _userService.UserExistsAsync(request.Email))
            {
                _logger.LogWarning("Email already exists: {Email}", request.Email);
                return BadRequest("Un compte avec cet email existe déjà.");
            }

            if (!await _userService.RoleExistsAsync(request.RoleId))
            {
                _logger.LogWarning("Invalid role ID: {RoleId}", request.RoleId);
                return BadRequest("Le rôle spécifié n'existe pas.");
            }

            if ((request.RoleId == 3 || request.RoleId == 4) && string.IsNullOrEmpty(request.JobTitle))
            {
                _logger.LogWarning("JobTitle is required for role: {RoleId}", request.RoleId);
                return BadRequest("JobTitle est requis pour ce rôle.");
            }

            try
            {
                var user = new User
                {
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    JobTitle = request.JobTitle ?? "Default Job Title",
                    Entreprise = request.RoleId == 2 ? request.Entreprise : null,
                    RoleId = request.RoleId,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow
                };

                var createdUser = await _userService.CreateUserAsync(user, request.ClaimIds ?? new List<int>());
                _logger.LogInformation($"User {user.Email} created successfully.");
                return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, MapUserToDTO(createdUser));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound("Utilisateur non trouvé.");
            }
            return Ok(MapUserToDTO(user));
        }

        [HttpGet]
        [Authorize(Policy = "CanViewUsers")]

        public async Task<ActionResult<List<UserDTO>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users.Select(u => MapUserToDTO(u)).ToList());
        }
        //update

        [HttpPut("{id}")]
        [Authorize(Policy = "CanUpdateUsers")]
        public async Task<ActionResult<UserDTO>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning($"User with ID {id} not found.");
                return NotFound("Utilisateur non trouvé.");
            }

            // Validate email if provided
            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                if (await _userService.UserExistsAsync(request.Email))
                {
                    _logger.LogWarning($"Email {request.Email} already exists.");
                    return BadRequest("Un compte avec cet email existe déjà.");
                }
            }

            // Validate RoleId if provided
            if (request.RoleId != 0 && !await _userService.RoleExistsAsync(request.RoleId))
            {
                _logger.LogWarning($"Invalid RoleId {request.RoleId} provided.");
                return BadRequest("Le rôle spécifié n'existe pas.");
            }

            // Validate JobTitle if RoleId changes to 3 or 4
            var targetRoleId = request.RoleId != 0 ? request.RoleId : user.RoleId;
            if (new[] { 3, 4 }.Contains(targetRoleId) &&
                request.RoleId != 0 && // Only validate if RoleId is being changed
                string.IsNullOrEmpty(request.JobTitle) &&
                string.IsNullOrEmpty(user.JobTitle))
            {
                _logger.LogWarning($"JobTitle is required for RoleId {targetRoleId}.");
                return BadRequest("JobTitle est requis pour ce rôle.");
            }

            // Update fields only if provided
            user.Email = request.Email ?? user.Email;
            user.FirstName = request.FirstName ?? user.FirstName;
            user.LastName = request.LastName ?? user.LastName;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            user.JobTitle = request.JobTitle ?? user.JobTitle ?? "Non défini";
            user.Entreprise = targetRoleId == 2 ? (request.Entreprise ?? user.Entreprise ?? "") : user.Entreprise;
            user.RoleId = request.RoleId != 0 ? request.RoleId : user.RoleId;

            // Update Password if provided
            if (!string.IsNullOrEmpty(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            // Update ClaimIds (default to existing if not provided)
            var claimIds = request.ClaimIds ?? user.UserClaims?.Select(uc => uc.ClaimId).ToList() ?? new List<int>();

            try
            {
                var updatedUser = await _userService.UpdateUserAsync(user, claimIds);
                _logger.LogInformation($"User {user.Email} updated successfully with ClaimIds: {string.Join(", ", claimIds)}");
                return Ok(MapUserToDTO(updatedUser));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user {user.Email}: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteUsers")]

        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                await _userService.DeleteUserAsync(id);
                _logger.LogInformation($"User with ID {id} deleted successfully.");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting user with ID {id}: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpGet("exists")]
        public async Task<ActionResult<bool>> UserExists([FromQuery] string email)
        {
            var userExists = await _userService.UserExistsAsync(email);
            return Ok(userExists);
        }

        private UserDTO MapUserToDTO(User user)
        {
            return new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                JobTitle = user.JobTitle,
                Entreprise = user.Entreprise,
                IsActive = user.IsActive,
                DateCreated = user.DateCreated,

                LastLogin = user.LastLogin,
                RoleId = user.RoleId,
                ClaimIds = user.UserClaims?.Select(uc => uc.ClaimId).ToList() ?? new List<int>()
            };
        }
            [HttpPatch("{id}/status")]
            public async Task<ActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusRequest request)
            {
                try
                {
                    var user = await _userService.GetUserByIdAsync(id);
                    if (user == null)
                    {
                        return NotFound("Utilisateur non trouvé.");
                    }

                    user.IsActive = request.IsActive;
                    await _userService.UpdateUserAsync(user, user.UserClaims?.Select(uc => uc.ClaimId).ToList() ?? new List<int>());

                    _logger.LogInformation($"User {user.Email} status updated to {request.IsActive}");
                    return NoContent();
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error updating user status: {ex.Message}");
                    return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
                }

            }

public class UpdateUserStatusRequest
        {
            public bool IsActive { get; set; }
        }
    }
    }
