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
            _httpClient.BaseAddress = new Uri("https://localhost:7151/api/");
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        private void AddAuthorizationHeader()
        {
            string token = null;
            var authHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = authHeader.Substring("Bearer ".Length).Trim();
                _logger.LogDebug($"Extracted token from Authorization header: {token.Substring(0, Math.Min(10, token.Length))}...");
            }
            if (string.IsNullOrEmpty(token))
            {
                token = _httpContextAccessor.HttpContext?.Request.Cookies["AuthToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    _logger.LogDebug($"Extracted token from AuthToken cookie: {token.Substring(0, Math.Min(10, token.Length))}...");
                }
            }
            if (!string.IsNullOrEmpty(token))
            {
                if (_httpClient.DefaultRequestHeaders.Contains("Authorization"))
                {
                    _httpClient.DefaultRequestHeaders.Remove("Authorization");
                }
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                _logger.LogInformation("Authorization header added to request");
            }
            else
            {
                _logger.LogError("No Authorization header or AuthToken cookie found in the request.");
                throw new InvalidOperationException("No authentication token found.");
            }
        }

        public async Task<UserDTO> GetUserByIdAsync(int userId)
        {
            try
            {
                AddAuthorizationHeader();
                _logger.LogDebug($"Fetching user with ID: {userId}");
                var response = await _httpClient.GetAsync($"users/{userId}");
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to fetch user {userId}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to fetch user: {errorContent}");
                }
                var user = await response.Content.ReadFromJsonAsync<UserDTO>();
                _logger.LogDebug($"User fetched: {System.Text.Json.JsonSerializer.Serialize(user)}");
                return user;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error fetching user {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateUserProfileAsync(int userId, UpdateOwnProfileRequest request)
        {
            try
            {
                AddAuthorizationHeader();
                _logger.LogDebug($"Updating profile for user {userId} with data: {System.Text.Json.JsonSerializer.Serialize(request)}");
                var response = await _httpClient.PatchAsJsonAsync($"users/{userId}/profile", request);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to update profile for user {userId}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to update profile: {errorContent}");
                }
                _logger.LogDebug($"Profile updated successfully for user {userId}");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error updating profile for user {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateUserPasswordAsync(int userId, string newPassword)
        {
            try
            {
                AddAuthorizationHeader();
                var updatePasswordRequest = new UpdatePasswordRequest
                {
                    NewPassword = newPassword
                };
                _logger.LogDebug($"Updating password for user {userId}");
                var response = await _httpClient.PatchAsJsonAsync($"users/{userId}/password", updatePasswordRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to update password for user {userId}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to update password: {errorContent}");
                }
                _logger.LogInformation($"Password updated successfully for user {userId}");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error updating password for user {userId}: {ex.Message}");
                throw;
            }
        }

        // Define the DTO to match the UsersController's UpdateOwnProfileRequest
        public class UpdateOwnProfileRequest
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string PhoneNumber { get; set; }
            public string JobTitle { get; set; }
        }
    }
}