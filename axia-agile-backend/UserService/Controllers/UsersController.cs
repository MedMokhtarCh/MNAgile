using Microsoft.AspNetCore.Mvc;
using UserService.DTOs;
using UserService.Models;
using UserService.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        public async Task<ActionResult<UserDTO>> CreateUser([FromBody] CreateUserRequest request)
        {
            if (request == null)
            {
                return BadRequest("Les données utilisateur sont requises.");
            }

            if (!await _userService.RoleExistsAsync(request.RoleId))
            {
                return BadRequest("Le rôle spécifié n'existe pas.");
            }

            if ((request.RoleId == 3 || request.RoleId == 4) && string.IsNullOrEmpty(request.JobTitle))
            {
                return BadRequest("JobTitle est requis pour ce rôle.");
            }

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

            try
            {
                var createdUser = await _userService.CreateUserAsync(user, request.ClaimIds);
                _logger.LogInformation($"User {user.Email} created successfully.");
                return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, MapUserToDTO(createdUser));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user {user.Email}: {ex.Message}");
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
        public async Task<ActionResult<List<UserDTO>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users.Select(u => MapUserToDTO(u)).ToList());
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDTO>> UpdateUser(int id, [FromBody] CreateUserRequest request)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound("Utilisateur non trouvé.");
            }

            if (!await _userService.RoleExistsAsync(request.RoleId))
            {
                return BadRequest("Le rôle spécifié n'existe pas.");
            }

            if ((request.RoleId == 3 || request.RoleId == 4) && string.IsNullOrEmpty(request.JobTitle))
            {
                return BadRequest("JobTitle est requis pour ce rôle.");
            }

            user.Email = request.Email;
            if (!string.IsNullOrEmpty(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.JobTitle = request.JobTitle ?? user.JobTitle;
            user.Entreprise = request.RoleId == 2 ? request.Entreprise : user.Entreprise;
            user.RoleId = request.RoleId;

            try
            {
                var updatedUser = await _userService.UpdateUserAsync(user, request.ClaimIds);
                _logger.LogInformation($"User {user.Email} updated successfully.");
                return Ok(MapUserToDTO(updatedUser));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user {user.Email}: {ex.Message}");
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
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
    }
}