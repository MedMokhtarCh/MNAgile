using Microsoft.AspNetCore.Mvc;
using ReunionService.DTOs;
using ReunionService.Services;

namespace ReunionService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("exchange-code")]
    public async Task<IActionResult> ExchangeCode([FromBody] Dictionary<string, string> request)
    {
        if (!request.ContainsKey("code"))
            return BadRequest("Code is required");

        var response = await _authService.ExchangeCodeForTokenAsync(request["code"]);
        var jwtToken = _authService.GenerateJwtToken(response.AccessToken.GetHashCode().ToString());

        return Ok(new { AccessToken = response.AccessToken, JwtToken = jwtToken });
    }
}