using System.Net.Http.Headers;
using ProfileService.DTOs;

namespace ProfileService.Services
{
    public class UserServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<UserServiceClient> _logger;

        public UserServiceClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor, ILogger<UserServiceClient> logger)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://localhost:5203/api/");
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        private void AddAuthorizationHeader()
        {
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.Replace("Bearer ", ""));
            }
            else
            {
                _logger.LogWarning("No Authorization header found in the request.");
            }
        }

        public async Task<UserDTO> GetUserByIdAsync(int userId)
        {
            try
            {
                AddAuthorizationHeader();
                var response = await _httpClient.GetAsync($"users/{userId}");
                response.EnsureSuccessStatusCode();
                var user = await response.Content.ReadFromJsonAsync<UserDTO>();
                return user;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error fetching user {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateUserAsync(UserDTO user)
        {
            try
            {
                AddAuthorizationHeader();
                var response = await _httpClient.PutAsJsonAsync($"users/{user.Id}", user);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error updating user {user.Id}: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateUserPasswordAsync(int userId, string newPassword)
        {
            try
            {
                AddAuthorizationHeader();
                var response = await _httpClient.PutAsJsonAsync($"users/{userId}", new { Password = newPassword });
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error updating password for user {userId}: {ex.Message}");
                throw;
            }
        }
    }
}