using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Models;

namespace UserService.Services
{
    public class SubscriptionService
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly EmailService _emailService;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(
            AppDbContext context,
            UserService userService,
            EmailService emailService,
            ILogger<SubscriptionService> logger)
        {
            _context = context;
            _userService = userService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<Subscription> CreateSubscriptionAsync(int userId, string plan)
        {
            var duration = GetSubscriptionDuration(plan);
            var subscription = new Subscription
            {
                UserId = userId,
                Plan = plan,
                Status = "Pending",
                StartDate = DateTime.UtcNow, // Temporary start date, updated on validation
                EndDate = DateTime.UtcNow.Add(duration),
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Subscription created for user ID {userId} with plan {plan}.");
            return subscription;
        }

        public async Task<Subscription> ValidateSubscriptionAsync(int subscriptionId)
        {
            var subscription = await _context.Subscriptions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == subscriptionId);
            if (subscription == null)
            {
                _logger.LogWarning($"Subscription ID {subscriptionId} not found.");
                throw new InvalidOperationException("Subscription not found.");
            }

            subscription.Status = "Active";
            subscription.StartDate = DateTime.UtcNow; // Set start date on validation
            subscription.EndDate = subscription.StartDate.Add(GetSubscriptionDuration(subscription.Plan));

            var user = await _context.Users.FindAsync(subscription.UserId);
            if (user != null)
            {
                user.IsActive = true;
                user.RootAdminId = user.Id; // Set as root admin
                _context.Users.Update(user);
            }

            // Update all users under this root admin
            var descendantUsers = await _context.Users
                .Where(u => u.RootAdminId == user.Id && u.Id != user.Id)
                .ToListAsync();
            foreach (var descendant in descendantUsers)
            {
                descendant.IsActive = true;
                _context.Users.Update(descendant);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Subscription ID {subscriptionId} validated for user ID {subscription.UserId}.");
            return subscription;
        }

        public async Task CheckAndDeactivateExpiredSubscriptionsAsync()
        {
            var expiredSubscriptions = await _context.Subscriptions
                .Include(s => s.User)
                .Where(s => s.Status == "Active" && s.EndDate <= DateTime.UtcNow)
                .ToListAsync();

            foreach (var subscription in expiredSubscriptions)
            {
                subscription.Status = "Expired";
                var user = await _context.Users.FindAsync(subscription.UserId);
                if (user != null)
                {
                    user.IsActive = false;
                    _context.Users.Update(user);

                    // Deactivate all users under this root admin
                    await _userService.DeactivateUsersByRootAdminAsync(user.Id);

                    // Send expiration email to the admin
                    await _emailService.SendSubscriptionExpiredEmailAsync(
                        user.Email,
                        user.FirstName,
                        subscription.Plan
                    );
                }
                _logger.LogInformation($"Subscription ID {subscription.Id} for user ID {subscription.UserId} has expired and user deactivated.");
            }

            await _context.SaveChangesAsync();
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