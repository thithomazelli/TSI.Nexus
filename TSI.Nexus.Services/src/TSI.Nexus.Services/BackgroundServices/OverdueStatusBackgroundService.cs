using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Interfaces;

namespace TSI.Nexus.Services.BackgroundServices
{
    public class OverdueStatusBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<OverdueStatusBackgroundService> _logger;
        private readonly TimeSpan _interval;

        #region Public methods

        public OverdueStatusBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<OverdueStatusBackgroundService> logger,
            IConfiguration configuration
        )
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            var seconds = 60; // default
            if (
                int.TryParse(configuration["OverdueCheckIntervalSeconds"], out var cfgSec)
                && cfgSec > 0
            )
            {
                seconds = cfgSec;
            }

            _interval = TimeSpan.FromSeconds(seconds);
        }

        #endregion Public methods

        #region Private methods

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "OverdueStatusBackgroundService started, interval {Interval}",
                _interval
            );

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOnceAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while running overdue status update");
                }

                await Task.Delay(_interval, stoppingToken);
            }

            _logger.LogInformation("OverdueStatusBackgroundService stopping");
        }

        private async Task ProcessOnceAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IOverdueService>();

            try
            {
                var result = await service.RunOverdueUpdateAsync();
                _logger.LogInformation(
                    "Overdue update executed. OrderProducts: {Ops}, Payments: {Payments}",
                    result.OrderProductsUpdated,
                    result.PaymentsUpdated
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute overdue update via IOverdueService");
            }
        }

        #endregion Private methods
    }
}
