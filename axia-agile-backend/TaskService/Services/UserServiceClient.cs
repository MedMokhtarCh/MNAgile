// TaskService/Services/UserServiceClient.cs
using System.Text.Json;

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

            // Forward JWT token from Authorization header or cookie
            var token = _httpContextAccessor.HttpContext?.Request.Cookies["AuthToken"];
            if (string.IsNullOrEmpty(token))
            {
                token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"]
                    .ToString().Replace("Bearer ", "");
            }

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("No JWT token found in cookie or Authorization header.");
                throw new InvalidOperationException("JWT token missing from request headers or cookie.");
            }

            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            _logger.LogDebug("Added JWT token to UserService request");

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

                    _logger.LogDebug($"Response for {normalizedEmail}: Status={response.StatusCode}, Content={content}");

                    if (response.IsSuccessStatusCode)
                    {
                        try
                        {
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
                        catch (JsonException ex)
                        {
                            _logger.LogError(ex, $"Failed to parse response for email {normalizedEmail}: {content}");
                            throw new InvalidOperationException($"Invalid response format from UserService for email {normalizedEmail}", ex);
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

                    _logger.LogDebug($"Response for user ID {userId}: Status={response.StatusCode}, Content={content}");

                    if (response.IsSuccessStatusCode)
                    {
                        try
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
                        catch (JsonException ex)
                        {
                            _logger.LogError(ex, $"Failed to parse response for user ID {userId}: {content}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to retrieve user with ID {userId}. Status: {response.StatusCode}, Content: {content}");
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
                var content = await response.Content.ReadAsStringAsync();

                _logger.LogDebug($"Response for user ID {userId}: Status={response.StatusCode}, Content={content}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"User {userId} validated successfully");
                    return true;
                }
                else
                {
                    _logger.LogWarning($"Failed to validate user {userId}. Status: {response.StatusCode}, Content: {content}");
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