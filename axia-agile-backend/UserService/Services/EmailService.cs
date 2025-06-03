using System.Net;
using System.Net.Mail;

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

            if (string.IsNullOrEmpty(_smtpHost)) _logger.LogError("Hôte SMTP non configuré.");
            if (string.IsNullOrEmpty(_smtpUsername)) _logger.LogError("Nom d'utilisateur SMTP non configuré.");
            if (string.IsNullOrEmpty(_smtpPassword)) _logger.LogError("Mot de passe SMTP non configuré.");
            if (string.IsNullOrEmpty(_fromEmail)) _logger.LogError("Adresse FromEmail non configurée.");
        }

        public async Task<bool> SendAccountCreationEmailAsync(string toEmail, string firstName, string lastName, string password)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi de l'email de création de compte à {toEmail}.");
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
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email de création de compte envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de l'envoi de l'email de création de compte à {toEmail}.");
                return false;
            }
        }

        public async Task<bool> SendSubscriptionConfirmationEmailAsync(string toEmail, string firstName, string plan)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi de l'email de confirmation d'abonnement à {toEmail}.");
                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "Confirmation de votre demande d'abonnement",
                    Body = $@"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #333;'>Demande d'abonnement reçue</h2>
                        <p>Bonjour <strong>{firstName}</strong>,</p>
                        <p>Votre demande d'abonnement <strong>{plan}</strong> a été reçue avec succès. Votre compte est en attente de validation par axiaAgile.</p>
                        <p>Vous recevrez un E-mail dès que votre abonnement sera validé.</p>
                        <p>Cordialement,<br/>L'équipe Support axiaAgile</p>
                    </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email de confirmation d'abonnement envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de l'envoi de l'email de confirmation d'abonnement à {toEmail}.");
                return false;
            }
        }

        public async Task<bool> SendSubscriptionValidatedEmailAsync(string toEmail, string firstName, string plan)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi de l'email de validation d'abonnement à {toEmail}.");
                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "Votre abonnement a été validé",
                    Body = $@"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #333;'>Abonnement validé</h2>
                        <p>Bonjour <strong>{firstName}</strong>,</p>
                        <p>Votre abonnement <strong>{plan}</strong> a été validé avec succès. Vous pouvez maintenant vous connecter à votre compte.</p>
                        <p>Cordialement,<br/>L'équipe Support axiaAgile</p>
                    </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email de validation d'abonnement envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de l'envoi de l'email de validation d'abonnement à {toEmail}.");
                return false;
            }
        }

        public async Task<bool> SendSubscriptionExpiredEmailAsync(string toEmail, string firstName, string plan)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi de l'email d'expiration d'abonnement à {toEmail}.");
                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "Votre abonnement a expiré",
                    Body = $@"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #333;'>Abonnement expiré</h2>
                        <p>Bonjour <strong>{firstName}</strong>,</p>
                        <p>Votre abonnement <strong>{plan}</strong> a expiré. Votre compte et tous les comptes associés ont été désactivés.</p>
                        <p>Veuillez renouveler votre abonnement pour réactiver votre compte.</p>
                        <p>Cordialement,<br/>L'équipe Support axiaAgile</p>
                    </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email d'expiration d'abonnement envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de l'envoi de l'email d'expiration d'abonnement à {toEmail}.");
                return false;
            }
        }

        public async Task<bool> SendSubscriptionRenewedEmailAsync(string toEmail, string id, string plan)
        {
            try
            {
                _logger.LogInformation($"Tentative d'envoi de l'email de renouvellement d'abonnement à {toEmail}.");
                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "Votre abonnement a été renouvelé",
                    Body = $@"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #333;'>Abonnement renouvelé</h2>
                    
                        <p>Votre abonnement a été renouvelé avec succès. Votre compte est en attente de validation par axiaAgile.</p>
                        <p>Vous recevrez un autre email une fois que votre abonnement sera validé.</p>
                        <p>Cordialement,<br/>L'équipe Support axiaAgile</p>
                    </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email de renouvellement d'abonnement envoyé avec succès à {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de l'envoi de l'email de renouvellement d'abonnement à {toEmail}.");
                return false;
            }
        }
    }
}