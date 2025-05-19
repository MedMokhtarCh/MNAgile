using System.Text;
using System.Text.Json;

namespace TaskService.Services
{
    public class NotificationServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationServiceClient> _logger;

        public NotificationServiceClient(HttpClient httpClient, IConfiguration configuration, ILogger<NotificationServiceClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _httpClient.BaseAddress = new Uri(configuration["ApiGateway:BaseUrl"]);
        }

        public async Task SendNotificationAsync(CreateNotificationDto notificationDto)
        {
            try
            {
                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(notificationDto),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_configuration["ApiGateway:NotificationServicePath"]}", jsonContent);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send notification: {errorContent}");
                    throw new Exception($"Échec de l'envoi de la notification : {errorContent}");
                }

                _logger.LogInformation($"Notification sent for user {notificationDto.UserId} by assigner {notificationDto.AssignerUserId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification for user {notificationDto.UserId}");
                throw new Exception("Erreur lors de l'envoi de la notification.", ex);
            }
        }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public int AssignerUserId { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; }
    }
}