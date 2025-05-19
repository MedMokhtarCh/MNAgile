using ReunionService.DTOs;

namespace ReunionService.Services;

public interface IAuthService
{
    Task<AuthResponseDto> ExchangeCodeForTokenAsync(string code);
    string GenerateJwtToken(string userId);
}