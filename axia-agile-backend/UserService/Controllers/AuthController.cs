using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using UserService.Data;
using UserService.DTOs;
using UserService.Services;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly AppDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AuthService authService, AppDbContext context, ILogger<AuthController> logger)
        {
            _authService = authService;
            _context = context;
            _logger = logger;
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                _logger.LogWarning("Login request is invalid: Email or Password is empty.");
                return BadRequest(new { message = "Les informations d'identification sont requises." });
            }

            if (!_authService.IsValidEmail(request.Email))
            {
                _logger.LogWarning("Invalid email format: {Email}", request.Email);
                return BadRequest(new { message = "Format d'email invalide." });
            }

            try
            {
                _logger.LogInformation("Attempting to authenticate user: {Email}", request.Email);
                var user = await _authService.AuthenticateAsync(request.Email, request.Password);
                if (user == null)
                {
                    _logger.LogWarning("Authentication failed for user: {Email}", request.Email);
                    return Unauthorized(new { message = "Email ou mot de passe incorrect." });
                }

                _logger.LogInformation("Generating JWT for user: {Email}", user.Email);
                var token = _authService.GenerateJwtToken(user);
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("Failed to generate JWT for user: {Email}", user.Email);
                    return StatusCode(500, new { message = "Erreur lors de la génération du token." });
                }

                _logger.LogInformation("Setting AuthToken cookie for user: {Email}", user.Email);
                Response.Cookies.Append("AuthToken", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddHours(24),
                    Path = "/"
                });

                _logger.LogInformation("AuthToken cookie set successfully for user: {Email}", user.Email);

                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        role = user.Role.Name,
                        roleId = user.RoleId,
                        claims = user.UserClaims.Select(uc => uc.Claim.Name).ToList()
                    }
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Authentication failed for user: {Email}. Reason: {Message}", request.Email, ex.Message);
                return Unauthorized(new { message = ex.Message }); // Return the specific message from AuthService
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal error during login for user: {Email}", request.Email

        );
                return StatusCode(500, new { message = "Une erreur interne est survenue.", error = ex.Message });
            }
        }
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                _logger.LogInformation("Processing GetCurrentUser request");

                // Récupérer l'ID utilisateur depuis les claims
                var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var id))
                {
                    _logger.LogWarning("No valid userId found in token claims");
                    return Unauthorized("Utilisateur non authentifié.");
                }

                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserClaims)
                    .ThenInclude(uc => uc.Claim)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    _logger.LogWarning("User not found for id: {UserId}", id);
                    return NotFound("Utilisateur non trouvé.");
                }

                return Ok(new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role.Name,
                    roleId = user.RoleId,
                    claims = user.UserClaims.Select(uc => uc.Claim.Name).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetCurrentUser");
                return StatusCode(500, new { message = "Erreur lors de la récupération de l'utilisateur.", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            _logger.LogInformation("Processing logout request");
            Response.Cookies.Delete("AuthToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            });
            _logger.LogInformation("AuthToken cookie deleted successfully");
            return Ok(new { message = "Déconnexion réussie." });
        }
    }
}