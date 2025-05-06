
using Microsoft.AspNetCore.Http;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TaskService.Services
{
    public class ProjectServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<ProjectServiceClient> _logger;

        public ProjectServiceClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor, ILogger<ProjectServiceClient> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _httpClient.BaseAddress = new Uri("http://localhost:5273/api/");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            try
            {
                // Forward JWT token from cookie or Authorization header
                var token = _httpContextAccessor.HttpContext?.Request.Cookies["AuthToken"];
                if (string.IsNullOrEmpty(token))
                {
                    token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"]
                        .ToString().Replace("Bearer ", "");
                }

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                    _logger.LogDebug("Added JWT token to ProjectService request");
                }
                else
                {
                    _logger.LogWarning("No JWT token found in cookie or Authorization header");
                }

                _logger.LogDebug($"Requesting project existence check at: {_httpClient.BaseAddress}projects/{projectId}");
                var response = await _httpClient.GetAsync($"projects/{projectId}");
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug($"Response Status: {response.StatusCode}, Content: {responseContent}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Project {projectId} exists.");
                    return true;
                }

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning($"Project {projectId} not found.");
                    return false;
                }

                _logger.LogWarning($"Failed to verify project {projectId}. Status: {response.StatusCode}, Response: {responseContent}");
                return false;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"Network error checking project {projectId} existence. Is ProjectService running?");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking project {projectId} existence");
                return false;
            }
        }
    }
}