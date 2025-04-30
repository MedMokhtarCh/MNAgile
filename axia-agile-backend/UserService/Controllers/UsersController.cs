using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Text.RegularExpressions;
using UserService.DTOs;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly Services.UserService _userService;
        private readonly AuthService _authService;
        private readonly ILogger<UsersController> _logger;
        private readonly IWebHostEnvironment _environment;

        public UsersController(Services.UserService userService, AuthService authService, ILogger<UsersController> logger, IWebHostEnvironment environment)
        {
            _userService = userService;
            _authService = authService;
            _logger = logger;
            _environment = environment;
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateUsers")]
        public async Task<ActionResult<UserDTO>> CreateUser([FromBody] CreateUserRequest request)
        {
            _logger.LogInformation("Received create user request: {@Request}", request);

            // Manual validation
            if (request == null)
            {
                _logger.LogWarning("Create user request is null");
                return BadRequest("Les données utilisateur sont requises.");
            }
            if (string.IsNullOrEmpty(request.Email) || !_authService.IsValidEmail(request.Email))
            {
                _logger.LogWarning("Invalid email: {Email}", request.Email);
                return BadRequest("Un email valide est requis.");
            }
            if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 12 ||
                !Regex.IsMatch(request.Password, @"[A-Z]") ||
                !Regex.IsMatch(request.Password, @"[a-z]") ||
                !Regex.IsMatch(request.Password, @"[0-9]") ||
                !Regex.IsMatch(request.Password, @"[!@#$%^&*]"))
            {
                _logger.LogWarning("Invalid password for user: {Email}", request.Email);
                return BadRequest("Le mot de passe doit contenir au moins 12 caractères, incluant majuscule, minuscule, chiffre et caractère spécial.");
            }
            if (string.IsNullOrEmpty(request.FirstName))
            {
                _logger.LogWarning("FirstName is required for user: {Email}", request.Email);
                return BadRequest("Le prénom est requis.");
            }
            if (string.IsNullOrEmpty(request.LastName))
            {
                _logger.LogWarning("LastName is required for user: {Email}", request.Email);
                return BadRequest("Le nom est requis.");
            }
            if (string.IsNullOrEmpty(request.PhoneNumber) || !Regex.IsMatch(request.PhoneNumber, @"^\+?[1-9]\d{1,14}$"))
            {
                _logger.LogWarning("Invalid phone number for user: {Email}", request.Email);
                return BadRequest("Un numéro de téléphone valide est requis.");
            }
            if (request.RoleId <= 0)
            {
                _logger.LogWarning("Invalid RoleId for user: {Email}", request.Email);
                return BadRequest("Un rôle valide est requis.");
            }

            // Restrict SuperAdmin creation to SuperAdmins only
            if (request.RoleId == 1)
            {
                var isSuperAdmin = User.HasClaim("RoleId", "1");
                if (!isSuperAdmin)
                {
                    _logger.LogWarning("Non-SuperAdmin attempted to create a SuperAdmin account: {Email}", request.Email);
                    return Forbid("Seul un SuperAdmin peut créer un compte SuperAdmin.");
                }
            }

            // Prevent SuperAdmin creation in production
            if (request.RoleId == 1 && _environment.IsProduction())
            {
                _logger.LogWarning("SuperAdmin creation attempted in production: {Email}", request.Email);
                return BadRequest("La création de comptes SuperAdmin n'est pas autorisée en production.");
            }

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
            if (request.RoleId == 2 && string.IsNullOrEmpty(request.Entreprise))
            {
                _logger.LogWarning("Entreprise is required for role: {RoleId}", request.RoleId);
                return BadRequest("Entreprise est requise pour ce rôle.");
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

            // Manual validation
            if (!string.IsNullOrEmpty(request.Email) && !_authService.IsValidEmail(request.Email))
            {
                _logger.LogWarning("Invalid email: {Email}", request.Email);
                return BadRequest("Un email valide est requis.");
            }
            if (!string.IsNullOrEmpty(request.Password) &&
                (request.Password.Length < 12 ||
                 !Regex.IsMatch(request.Password, @"[A-Z]") ||
                 !Regex.IsMatch(request.Password, @"[a-z]") ||
                 !Regex.IsMatch(request.Password, @"[0-3]") ||
                 !Regex.IsMatch(request.Password, @"[!@#$%^&*]")))
            {
                _logger.LogWarning("Invalid password for user: {Email}", user.Email);
                return BadRequest("Le mot de passe doit contenir au moins 6 caractères, incluant majuscule, minuscule, chiffre et caractère spécial.");
            }
            if (!string.IsNullOrEmpty(request.PhoneNumber) && !Regex.IsMatch(request.PhoneNumber, @"^\+?[1-3]\d{1,14}$"))
            {
                _logger.LogWarning("Invalid phone number for user: {Email}", user.Email);
                return BadRequest("Un numéro de téléphone valide est requis.");
            }

            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                if (await _userService.UserExistsAsync(request.Email))
                {
                    _logger.LogWarning($"Email {request.Email} already exists.");
                    return BadRequest("Un compte avec cet email existe déjà.");
                }
            }

            if (request.RoleId != 0 && !await _userService.RoleExistsAsync(request.RoleId))
            {
                _logger.LogWarning($"Invalid RoleId {request.RoleId} provided.");
                return BadRequest("Le rôle spécifié n'existe pas.");
            }

            var targetRoleId = request.RoleId != 0 ? request.RoleId : user.RoleId;
            if (new[] { 3, 4 }.Contains(targetRoleId) &&
                request.RoleId != 0 &&
                string.IsNullOrEmpty(request.JobTitle) &&
                string.IsNullOrEmpty(user.JobTitle))
            {
                _logger.LogWarning($"JobTitle is required for RoleId {targetRoleId}.");
                return BadRequest("JobTitle est requis pour ce rôle.");
            }
            if (targetRoleId == 2 && request.Entreprise == null && user.Entreprise == null)
            {
                _logger.LogWarning($"Entreprise is required for RoleId {targetRoleId}.");
                return BadRequest("Entreprise est requise pour ce rôle.");
            }

            user.Email = request.Email ?? user.Email;
            user.FirstName = request.FirstName ?? user.FirstName;
            user.LastName = request.LastName ?? user.LastName;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            user.JobTitle = request.JobTitle ?? user.JobTitle ?? "Non défini";
            user.Entreprise = targetRoleId == 2 ? (request.Entreprise ?? user.Entreprise ?? "") : user.Entreprise;
            user.RoleId = request.RoleId != 0 ? request.RoleId : user.RoleId;

            if (!string.IsNullOrEmpty(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

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
            if (string.IsNullOrEmpty(email) || !_authService.IsValidEmail(email))
            {
                return BadRequest("Un email valide est requis.");
            }
            var userExists = await _userService.UserExistsAsync(email);
            return Ok(userExists);
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

        public class UpdateUserStatusRequest
        {
            public bool IsActive { get; set; }
        }
    }
}