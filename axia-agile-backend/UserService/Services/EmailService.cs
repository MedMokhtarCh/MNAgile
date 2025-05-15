using System.Net.Mail;
using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace UserService.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _smtpHost = _configuration["EmailSettings:SmtpHost"];
            _smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            _smtpUsername = _configuration["EmailSettings:SmtpUsername"];
            _smtpPassword = _configuration["EmailSettings:SmtpPassword"];
            _fromEmail = _configuration["EmailSettings:FromEmail"];
            _fromName = _configuration["EmailSettings:FromName"];

            // Vérifier que les paramètres sont chargés
            if (string.IsNullOrEmpty(_smtpHost))
                _logger.LogError("Hôte SMTP non configuré.");
            if (string.IsNullOrEmpty(_smtpUsername))
                _logger.LogError("Nom d'utilisateur SMTP non configuré.");
            if (string.IsNullOrEmpty(_smtpPassword))
                _logger.LogError("Mot de passe SMTP non configuré.");
            if (string.IsNullOrEmpty(_fromEmail))
                _logger.LogError("Adresse FromEmail non configurée.");
        }

        public async Task<bool> SendAccountCreationEmailAsync(string toEmail, string firstName, string lastName, string password)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi d'email à {toEmail} depuis {_fromEmail} via SMTP {_smtpHost}:{_smtpPort}");

                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "Bienvenue - Vos identifiants de connexion",
                    Body = $@"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #333;'>Bienvenue !</h2>
                        <p>Bonjour <strong>{firstName}</strong>,</p>
                        <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
                        <div style='background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                            <p><strong>Email:</strong> {toEmail}</p>
                            <p><strong>Mot de passe:</strong> {password}</p>
                        </div>
                        <p>Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                        <p>Cordialement,<br/>L'équipe Support axiaAgile</p>
                    </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);

                _logger.LogDebug("Connexion au serveur SMTP...");
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, $"Erreur SMTP lors de l'envoi de l'email à {toEmail}: {ex.Message}, StatusCode: {ex.StatusCode}");
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