using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using UserService.Services;


namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly Services.UserService _userService;
        private readonly SubscriptionService _subscriptionService;
        private readonly EmailService _emailService;
        private readonly AuthService _authService;
        private readonly AppDbContext _context;
        private readonly ILogger<SubscriptionsController> _logger;

        public SubscriptionsController(
            Services.UserService userService,
            SubscriptionService subscriptionService,
            EmailService emailService,
            AuthService authService,
            AppDbContext context,
            ILogger<SubscriptionsController> logger)
        {
            _userService = userService;
            _subscriptionService = subscriptionService;
            _emailService = emailService;
            _authService = authService;
            _context = context;
            _logger = logger;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            _logger.LogInformation("Received signup request: {@Request}", request);

            // Validate request
            if (request == null)
            {
                _logger.LogWarning("Signup request is null");
                return BadRequest("Les données utilisateur sont requises.");
            }
            if (string.IsNullOrEmpty(request.Email) || !_authService.IsValidEmail(request.Email))
            {
                _logger.LogWarning("Invalid email: {Email}", request.Email);
                return BadRequest("Un email valide est requis.");
            }
            if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 12 ||
                !Regex.IsMatch(request.Password, @"[A-Z]") ||
                !Regex.IsMatch(request.Password, @"[a-z]") ||
                !Regex.IsMatch(request.Password, @"[0-9]") ||
                !Regex.IsMatch(request.Password, @"[!@#$%^&*]"))
            {
                _logger.LogWarning("Invalid password for email: {Email}", request.Email);
                return BadRequest("Le mot de passe doit contenir au moins 12 caractères, incluant majuscule, minuscule, chiffre et caractère spécial.");
            }
            if (string.IsNullOrEmpty(request.FirstName))
            {
                _logger.LogWarning("FirstName is required for email: {Email}", request.Email);
                return BadRequest("Le prénom est requis.");
            }
            if (string.IsNullOrEmpty(request.LastName))
            {
                _logger.LogWarning("LastName is required for email: {Email}", request.Email);
                return BadRequest("Le nom est requis.");
            }
            if (string.IsNullOrEmpty(request.PhoneNumber) || !Regex.IsMatch(request.PhoneNumber, @"^\+?[1-9]\d{1,14}$"))
            {
                _logger.LogWarning("Invalid phone number for email: {Email}", request.Email);
                return BadRequest("Un numéro de téléphone valide est requis.");
            }
            if (string.IsNullOrEmpty(request.Entreprise))
            {
                _logger.LogWarning("Entreprise is required for email: {Email}", request.Email);
                return BadRequest("L'entreprise est requise.");
            }
            if (!new[] { "monthly", "quarterly", "semiannual", "annual" }.Contains(request.Plan))
            {
                _logger.LogWarning("Invalid subscription plan: {Plan}", request.Plan);
                return BadRequest("Plan d'abonnement invalide.");
            }

            // Validate RoleId
            const int adminRoleId = 2;
            if (!await _userService.RoleExistsAsync(adminRoleId))
            {
                _logger.LogWarning("Admin role (ID {RoleId}) does not exist.", adminRoleId);
                return BadRequest("Le rôle Admin (ID 2) n'existe pas dans la base de données.");
            }

            // Validate ClaimIds
            var claimIds = new List<int> { 1, 2,3,4 }; // CanViewUsers, CanCreateUsers
            foreach (var claimId in claimIds)
            {
                if (!await _context.Claims.AnyAsync(c => c.Id == claimId))
                {
                    _logger.LogWarning("Claim ID {ClaimId} does not exist.", claimId);
                    return BadRequest($"Le Claim ID {claimId} n'existe pas.");
                }
            }

            // Check if user already exists
            if (await _userService.UserExistsAsync(request.Email))
            {
                _logger.LogWarning("Email already exists: {Email}", request.Email);
                return BadRequest("Un compte avec cet email existe déjà.");
            }

            try
            {
                // Create user
                var user = new User
                {
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    Entreprise = request.Entreprise,
                    RoleId = adminRoleId, // Admin role
                    IsActive = false, // Inactive until validated
                    DateCreated = DateTime.UtcNow,
                    CreatedById = null // Self-created
                };

                var createdUser = await _userService.CreateUserAsync(user, claimIds);
                _logger.LogInformation("User {Email} created successfully for subscription signup with ID {UserId}.", user.Email, createdUser.Id);

                // Create subscription
                var subscription = await _subscriptionService.CreateSubscriptionAsync(createdUser.Id, request.Plan);
                _logger.LogInformation("Subscription created for user {Email} with plan {Plan} and ID {SubscriptionId}.", user.Email, request.Plan, subscription.Id);

                // Send confirmation email
                var emailSent = await _emailService.SendSubscriptionConfirmationEmailAsync(
                    user.Email,
                    user.FirstName,
                    request.Plan
                );

                if (!emailSent)
                {
                    _logger.LogWarning("Failed to send subscription confirmation email to {Email}.", user.Email);
                }
                else
                {
                    _logger.LogInformation("Subscription confirmation email sent successfully to {Email}.", user.Email);
                }

                return Ok(new
                {
                    message = "Inscription réussie. Votre compte est en attente de validation.",
                    userId = createdUser.Id,
                    subscriptionId = subscription.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signup for email {Email}. InnerException: {InnerException}", request.Email, ex.InnerException?.Message);
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}. InnerException: {ex.InnerException?.Message}");
            }
        }

        // Other methods (ValidateSubscription, GetPendingSubscriptions) remain unchanged
        [HttpPost("{subscriptionId}/validate")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ValidateSubscription(int subscriptionId)
        {
            try
            {
                var subscription = await _subscriptionService.ValidateSubscriptionAsync(subscriptionId);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == subscription.UserId);

                if (user == null)
                {
                    _logger.LogWarning("User not found for subscription ID {SubscriptionId}.", subscriptionId);
                    return NotFound("Utilisateur non trouvé.");
                }

                var emailSent = await _emailService.SendSubscriptionValidatedEmailAsync(
                    user.Email,
                    user.FirstName,
                    subscription.Plan
                );

                if (!emailSent)
                {
                    _logger.LogWarning("Failed to send subscription validated email to {Email}.", user.Email);
                }
                else
                {
                    _logger.LogInformation("Subscription validated email sent successfully to {Email}.", user.Email);
                }

                return Ok(new { message = "Abonnement validé avec succès." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating subscription ID {SubscriptionId}. InnerException: {InnerException}", subscriptionId, ex.InnerException?.Message);
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}. InnerException: {ex.InnerException?.Message}");
            }
        }

        [HttpGet("pending")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetPendingSubscriptions()
        {
            try
            {
                var subscriptions = await _context.Subscriptions
                    .Include(s => s.User)
                    .Where(s => s.Status == "Pending")
                    .Select(s => new
                    {
                        s.Id,
                        s.Plan,
                        s.StartDate,
                        s.EndDate,
                        User = new
                        {
                            s.User.Id,
                            s.User.Email,
                            s.User.FirstName,
                            s.User.LastName,
                            s.User.Entreprise
                        }
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} pending subscriptions.", subscriptions.Count);
                return Ok(subscriptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending subscriptions. InnerException: {InnerException}", ex.InnerException?.Message);
                return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}. InnerException: {ex.InnerException?.Message}");
            }
        }
        [HttpPost("{subscriptionId}/renew")]
        public async Task<IActionResult> RenewSubscription(int subscriptionId, [FromBody] RenewSubscriptionRequest request)
        {
            try
            {
                // Validate request
                if (request == null)
                {
                    _logger.LogWarning("Renew subscription request is null for subscription ID {SubscriptionId}.", subscriptionId);
                    return BadRequest("Les données de renouvellement sont requises.");
                }

                // Validate plan
                if (!new[] { "monthly", "quarterly", "semiannual", "annual" }.Contains(request.Plan))
                {
                    _logger.LogWarning("Invalid subscription plan for renewal: {Plan}, subscription ID {SubscriptionId}.", request.Plan, subscriptionId);
                    return BadRequest("Plan d'abonnement invalide.");
                }

                // Fetch subscription
                var subscription = await _context.Subscriptions
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Id == subscriptionId);

                if (subscription == null)
                {
                    _logger.LogWarning("Subscription ID {SubscriptionId} not found for renewal.", subscriptionId);
                    return NotFound("Abonnement non trouvé.");
                }

                // Check if subscription is expired
                if (subscription.Status != "Expired")
                {
                    _logger.LogWarning("Subscription ID {SubscriptionId} is not expired (Status: {Status}).", subscriptionId, subscription.Status);
                    return BadRequest("Seuls les abonnements expirés peuvent être renouvelés.");
                }

                // Use transaction for database operations
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Renew subscription
                    subscription.Plan = request.Plan;
                    subscription.Status = "Pending"; // Set to pending for validation
                    subscription.StartDate = DateTime.UtcNow;
                    subscription.EndDate = subscription.StartDate.Add(GetSubscriptionDuration(request.Plan));

                    _context.Subscriptions.Update(subscription);
                    await _context.SaveChangesAsync();

                    // Send renewal confirmation email
                    var emailSent = await _emailService.SendSubscriptionRenewedEmailAsync(
                        subscription.User.Email,
                        subscription.User.FirstName,
                        request.Plan
                    );

                    if (!emailSent)
                    {
                        _logger.LogWarning("Failed to send renewal confirmation email to {Email} for subscription ID {SubscriptionId}.", subscription.User.Email, subscriptionId);
                    }
                    else
                    {
                        _logger.LogInformation("Renewal confirmation email sent successfully to {Email} for subscription ID {SubscriptionId}.", subscription.User.Email, subscriptionId);
                    }

                    await transaction.CommitAsync();

                    _logger.LogInformation("Subscription ID {SubscriptionId} renewed with plan {Plan}.", subscriptionId, request.Plan);

                    return Ok(new
                    {
                        message = "Demande de renouvellement d'abonnement reçue. Votre compte sera réactivé après validation.",
                        subscriptionId = subscription.Id,
                        plan = request.Plan
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error renewing subscription ID {SubscriptionId}. InnerException: {InnerException}", subscriptionId, ex.InnerException?.Message);
                    return StatusCode(500, $"Une erreur interne est survenue : {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error renewing subscription ID {SubscriptionId}. InnerException: {InnerException}", subscriptionId, ex.InnerException?.Message);
                return StatusCode(500, $"Une erreur inattendue est survenue : {ex.Message}");
            }
        }
        private TimeSpan GetSubscriptionDuration(string plan)
        {
            return plan.ToLower() switch
            {
                "monthly" => TimeSpan.FromDays(30),
                "quarterly" => TimeSpan.FromDays(90),
                "semiannual" => TimeSpan.FromDays(180),
                "annual" => TimeSpan.FromDays(365),
                _ => throw new ArgumentException("Invalid subscription plan.")
            };
        }

    }

    }
