using Microsoft.AspNetCore.Mvc;
using UserService.DTOs;
using UserService.Services;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Les informations d'identification sont requises.");
            }

            if (!_authService.IsValidEmail(request.Email))
            {
                return BadRequest("Format d'email invalide.");
            }

            try
            {
                var user = await _authService.AuthenticateAsync(request.Email, request.Password);

                if (user == null)
                {
                    return Unauthorized("Email ou mot de passe incorrect.");
                }

                var token = _authService.GenerateJwtToken(user);

                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        role = user.Role.Name,
                        roleId = user.RoleId
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }



    }
}