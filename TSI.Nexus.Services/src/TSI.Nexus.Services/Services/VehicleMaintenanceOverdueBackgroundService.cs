using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Interfaces;

namespace TSI.Nexus.Services.Services
{
    public class VehicleMaintenanceOverdueBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VehicleMaintenanceOverdueBackgroundService> _logger;
        private readonly TimeSpan _interval;

        #region Public methods

        public VehicleMaintenanceOverdueBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<VehicleMaintenanceOverdueBackgroundService> logger,
            IConfiguration configuration
        )
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            var seconds = 3600; // default: once an hour is enough for a date-based check
            if (
                int.TryParse(
                    configuration["VehicleMaintenanceOverdueCheckIntervalSeconds"],
                    out var cfgSec
                ) && cfgSec > 0
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
                "VehicleMaintenanceOverdueBackgroundService started, interval {Interval}",
                _interval
            );

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOnceAsync(stoppingToken);
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // shutdown requested
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while running vehicle maintenance overdue update");
                }
            }

            _logger.LogInformation("VehicleMaintenanceOverdueBackgroundService stopping");
        }

        private async Task ProcessOnceAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IVehicleMaintenanceOverdueService>();

            try
            {
                var result = await service.RunOverdueUpdateAsync();
                _logger.LogInformation(
                    "Vehicle maintenance overdue update executed. Maintenances: {Maintenances}, VehiclesBlocked: {VehiclesBlocked}",
                    result.MaintenancesUpdated,
                    result.VehiclesBlocked
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to execute vehicle maintenance overdue update via IVehicleMaintenanceOverdueService"
                );
            }
        }

        #endregion Private methods
    }
}
