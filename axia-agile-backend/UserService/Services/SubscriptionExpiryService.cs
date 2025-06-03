using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace UserService.Services
{
    public class SubscriptionExpiryService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SubscriptionExpiryService> _logger;

        public SubscriptionExpiryService(IServiceProvider serviceProvider, ILogger<SubscriptionExpiryService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var subscriptionService = scope.ServiceProvider.GetRequiredService<SubscriptionService>();
                        await subscriptionService.CheckAndDeactivateExpiredSubscriptionsAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in SubscriptionExpiryService");
                }

                // Check every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}