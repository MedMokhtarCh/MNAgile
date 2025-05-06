using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace TaskService.Services
{
    public class UserServiceClient
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UserServiceClient> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _userServiceUrl;

        public UserServiceClient(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<UserServiceClient> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

            _userServiceUrl = _configuration["UserService:BaseUrl"];
            if (string.IsNullOrEmpty(_userServiceUrl))
            {
                _logger.LogError("UserService BaseUrl configuration is missing.");
                throw new InvalidOperationException("UserService BaseUrl configuration is missing.");
            }
        }

        private HttpClient CreateAuthorizedClient()
        {
            var client = _httpClientFactory.CreateClient();

            // Bypassed JWT token check for testing
            /*
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"]
                .ToString().Replace("Bearer ", "");

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("No JWT token found in request headers.");
                throw new InvalidOperationException("JWT token missing from request headers.");
            }

            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            */

            client.BaseAddress = new Uri(_userServiceUrl);
            client.Timeout = TimeSpan.FromSeconds(30);

            return client;
        }

        public async Task<Dictionary<string, int>> GetUserIdsByEmailsAsync(List<string> emails)
        {
            if (emails == null || emails.Count == 0)
            {
                return new Dictionary<string, int>();
            }

            var userIds = new Dictionary<string, int>();
            HttpClient client = null;

            try
            {
                client = CreateAuthorizedClient();

                foreach (var email in emails)
                {
                    if (string.IsNullOrWhiteSpace(email))
                    {
                        _logger.LogWarning("Empty email provided to GetUserIdsByEmailsAsync");
                        continue;
                    }

                    var normalizedEmail = email.ToLowerInvariant();
                    _logger.LogDebug($"Checking user with email: {normalizedEmail}");

                    var response = await client.GetAsync($"/api/users/exists?email={Uri.EscapeDataString(normalizedEmail)}");
                    var content = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogDebug($"Response for {normalizedEmail}: {content}");

                        var responseObj = JsonSerializer.Deserialize<UserExistenceResponse>(
                            content,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );

                        if (responseObj?.Exists == true && responseObj.UserId.HasValue)
                        {
                            userIds[email] = responseObj.UserId.Value;
                            _logger.LogInformation($"User with email {normalizedEmail} found with ID {responseObj.UserId.Value}");
                        }
                        else
                        {
                            _logger.LogWarning($"User with email {normalizedEmail} does not exist or is inactive");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to check user {normalizedEmail}. Status: {response.StatusCode}, Response: {content}");
                    }
                }

                return userIds;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error in GetUserIdsByEmailsAsync: {ex.Message}");
                throw new InvalidOperationException($"Network error communicating with UserService: {ex.Message}", ex);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"JSON parsing error in GetUserIdsByEmailsAsync: {ex.Message}");
                throw new InvalidOperationException($"Error parsing UserService response: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error in GetUserIdsByEmailsAsync: {ex.Message}");
                throw new InvalidOperationException($"Unexpected error validating users: {ex.Message}", ex);
            }
        }

        public async Task<List<string>> GetEmailsByUserIdsAsync(List<int> userIds)
        {
            if (userIds == null || userIds.Count == 0)
            {
                return new List<string>();
            }

            var emails = new List<string>();
            HttpClient client = null;

            try
            {
                client = CreateAuthorizedClient();

                foreach (var userId in userIds)
                {
                    if (userId <= 0)
                    {
                        _logger.LogWarning($"Invalid user ID: {userId}");
                        continue;
                    }

                    _logger.LogDebug($"Retrieving user with ID: {userId}");

                    var response = await client.GetAsync($"/api/users/{userId}");
                    var content = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        var user = JsonSerializer.Deserialize<UserDTO>(
                            content,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );

                        if (user != null && !string.IsNullOrEmpty(user.Email))
                        {
                            emails.Add(user.Email);
                            _logger.LogInformation($"Retrieved email {user.Email} for user ID {userId}");
                        }
                        else
                        {
                            _logger.LogWarning($"Invalid user data for ID {userId}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to retrieve user with ID {userId}. Status: {response.StatusCode}");
                    }
                }

                return emails;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error in GetEmailsByUserIdsAsync: {ex.Message}");
                throw new InvalidOperationException($"Network error communicating with UserService: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error in GetEmailsByUserIdsAsync: {ex.Message}");
                throw new InvalidOperationException($"Error retrieving user emails: {ex.Message}", ex);
            }
        }

        public async Task<bool> ValidateUserAsync(int userId)
        {
            if (userId <= 0)
            {
                _logger.LogWarning($"Invalid user ID provided to ValidateUserAsync: {userId}");
                return false;
            }

            try
            {
                var client = CreateAuthorizedClient();
                _logger.LogDebug($"Validating user with ID: {userId}");

                var response = await client.GetAsync($"/api/users/{userId}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"User {userId} validated successfully");
                    return true;
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Failed to validate user {userId}. Status: {response.StatusCode}, Response: {content}");
                    return false;
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error validating user {userId}: {ex.Message}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error validating user {userId}: {ex.Message}");
                return false;
            }
        }
    }

    public class UserExistenceResponse
    {
        public bool Exists { get; set; }
        public int? UserId { get; set; }
    }

    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
    }
}