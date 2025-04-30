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

            // Try to get token from Authorization header
            var authHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = authHeader.Substring("Bearer ".Length).Trim();
                _logger.LogInformation($"Extracted token from Authorization header: {token.Substring(0, Math.Min(10, token.Length))}...");
            }

            // If no token in header, try to get from AuthToken cookie
            if (string.IsNullOrEmpty(token))
            {
                token = _httpContextAccessor.HttpContext?.Request.Cookies["AuthToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    _logger.LogInformation($"Extracted token from AuthToken cookie: {token.Substring(0, Math.Min(10, token.Length))}...");
                }
            }

            // Add token to request if found
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
                _logger.LogWarning("No Authorization header or AuthToken cookie found in the request.");
            }
        }

        public async Task<UserDTO> GetUserByIdAsync(int userId)
        {
            try
            {
                AddAuthorizationHeader();
                var response = await _httpClient.GetAsync($"users/{userId}");
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to fetch user {userId}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to fetch user: {errorContent}");
                }
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
                var updateRequest = new UpdateUserRequest
                {
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    JobTitle = user.JobTitle,
                    Entreprise = user.Entreprise,
                    RoleId = user.RoleId,
                    ClaimIds = user.ClaimIds
                };

                var response = await _httpClient.PutAsJsonAsync($"users/{user.Id}", updateRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to update user {user.Id}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to update user: {errorContent}");
                }
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

                // Fetch current user data to preserve other fields
                var user = await GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found.");
                    throw new InvalidOperationException("Utilisateur non trouvé.");
                }

                var updateRequest = new UpdateUserRequest
                {
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    JobTitle = user.JobTitle,
                    Entreprise = user.Entreprise,
                    RoleId = user.RoleId,
                    ClaimIds = user.ClaimIds,
                    Password = newPassword // Only update password
                };

                var response = await _httpClient.PutAsJsonAsync($"users/{userId}", updateRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to update password for user {userId}. Status: {response.StatusCode}, Content: {errorContent}");
                    throw new HttpRequestException($"Failed to update password: {errorContent}");
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Error updating password for user {userId}: {ex.Message}");
                throw;
            }
        }
    }
}