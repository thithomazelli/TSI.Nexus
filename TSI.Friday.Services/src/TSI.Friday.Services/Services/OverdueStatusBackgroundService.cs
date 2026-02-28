using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.Services.Services
{
    public class OverdueStatusBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<OverdueStatusBackgroundService> _logger;
        private readonly TimeSpan _interval; // fallback interval if scheduling fails
        #region Public methods

        public OverdueStatusBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<OverdueStatusBackgroundService> logger,
            IConfiguration configuration
        )
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            // default interval used as fallback (24 hours)
            _interval = TimeSpan.FromDays(1);
        }

        #endregion Public methods

        #region Protected methods

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "OverdueStatusBackgroundService started, scheduled daily at midnight UTC"
            );

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Calculate next midnight UTC
                    var now = DateTime.UtcNow;
                    var nextMidnight = now.Date.AddDays(1); // midnight of next day UTC
                    var delay = nextMidnight - now;
                    if (delay < TimeSpan.Zero)
                        delay = TimeSpan.Zero;

                    _logger.LogInformation("Next overdue run scheduled in {Delay}", delay);
                    await Task.Delay(delay, stoppingToken);

                    // Execute overdue update within a scope
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IOverdueService>();
                    var result = await service.RunOverdueUpdateAsync();
                    _logger.LogInformation(
                        "Overdue update executed. OrderProducts: {Ops}, Payments: {Payments}",
                        result.OrderProductsUpdated,
                        result.PaymentsUpdated
                    );
                }
                catch (OperationCanceledException)
                {
                    // shutdown requested
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while running overdue status update");
                    // fallback wait to avoid tight loop
                    await Task.Delay(_interval, stoppingToken);
                }
            }

            _logger.LogInformation("OverdueStatusBackgroundService stopping");
        }

        #endregion Protected methods
    }
}
