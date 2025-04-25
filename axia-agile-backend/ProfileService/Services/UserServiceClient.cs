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
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            _logger.LogInformation($"Original Authorization header: {token}");

            if (!string.IsNullOrEmpty(token))
            {
                // Authorization header
                if (_httpClient.DefaultRequestHeaders.Contains("Authorization"))
                {
                    _httpClient.DefaultRequestHeaders.Remove("Authorization");
                }

                // Extract just the token part without "Bearer "
                string tokenValue = token;
                if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    tokenValue = token.Substring(7);
                    _logger.LogInformation($"Extracted token: {tokenValue.Substring(0, Math.Min(10, tokenValue.Length))}...");
                }

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenValue);
                _logger.LogInformation("Authorization header added to request");
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

               
                var updateRequest = new { Password = newPassword };

                var response = await _httpClient.PutAsJsonAsync($"users/{userId}", updateRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"User service returned non-success status code: {response.StatusCode}. Content: {errorContent}");
                }

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
    
