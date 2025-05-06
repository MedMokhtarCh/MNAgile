using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System;

namespace ProjectService.Services
{
    public class UserServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UserServiceClient> _logger;

        public UserServiceClient(HttpClient httpClient, ILogger<UserServiceClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> UserExistsAsync(string email)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/users/exists?email={email}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"Réponse de UserService pour l'email {email} : {content}");

                    // Parse the correct response structure from UserService
                    var userExistenceResponse = JsonSerializer.Deserialize<UserExistenceResponse>(content,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    return userExistenceResponse?.Exists ?? false;
                }

                _logger.LogError($"Erreur lors de la vérification de l'existence de l'utilisateur {email}. Statut : {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de la connexion à UserService : {ex.Message}");
            }

            return false;
        }

        private class UserExistenceResponse
        {
            public bool Exists { get; set; }
            public int? UserId { get; set; }
        }
    }
}