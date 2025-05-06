using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace UserService.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _apiKey;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _apiKey = _configuration["EmailSettings:ApiKey"];
            _fromEmail = _configuration["EmailSettings:FromEmail"];
            _fromName = _configuration["EmailSettings:FromName"];

            // Vérifier que les paramètres sont chargés
            if (string.IsNullOrEmpty(_apiKey))
                _logger.LogError("Clé API MailerSend non configurée.");
            if (string.IsNullOrEmpty(_fromEmail))
                _logger.LogError("Adresse FromEmail non configurée.");
        }

        public async Task<bool> SendAccountCreationEmailAsync(string toEmail, string firstName, string lastName, string password)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi d'email à {toEmail} depuis {_fromEmail}");

                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

                var payload = new
                {
                    from = new { email = _fromEmail, name = _fromName },
                    to = new[] { new { email = toEmail, name = $"{firstName} {lastName}" } },
                    subject = "Bienvenue - Vos identifiants de connexion",
                    text = $"Bonjour {firstName},\nVotre compte a été créé avec succès. Voici vos identifiants :\n\nEmail: {toEmail}\nMot de passe: {password}\n\nNous vous recommandons de changer votre mot de passe lors de votre première connexion.",
                    html = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                            <h2 style='color: #333;'>Bienvenue !</h2>
                            <p>Bonjour <strong>{firstName}</strong>,</p>
                            <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
                            <div style='background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                                <p><strong>Email:</strong> {toEmail}</p>
                                <p><strong>Mot de passe:</strong> {password}</p>
                            </div>
                            <p>Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                            <p>Cordialement,<br/>L'équipe Support</p>
                        </div>"
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync("https://api.mailersend.com/v1/email", content);

                bool successful = response.IsSuccessStatusCode;

                if (successful)
                {
                    _logger.LogInformation($"Email envoyé avec succès à {toEmail}. Code HTTP: {response.StatusCode}");
                }
                else
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Échec d'envoi d'email à {toEmail}. Code HTTP: {response.StatusCode}, Réponse: {responseContent}");
                }

                return successful;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"Erreur réseau lors de l'envoi de l'email à {toEmail}: {ex.Message}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur inattendue lors de l'envoi de l'email à {toEmail}: {ex.Message}");
                return false;
            }
        }
    }
}