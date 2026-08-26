using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Services.Services;

namespace TSI.Nexus.Services.Tests.Services
{
    public class VehicleMaintenanceOverdueBackgroundServiceTests
    {
        private static IConfiguration ConfigWithIntervalSeconds(int seconds) =>
            new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["VehicleMaintenanceOverdueCheckIntervalSeconds"] = seconds.ToString(),
                    }
                )
                .Build();

        [Fact]
        public async Task ExecuteAsync_ShouldRunOnceImmediately_AndLogResult()
        {
            // The loop calls ProcessOnceAsync before its first delay, so the update runs right
            // away regardless of the configured interval - a short-lived Start/Stop is enough to
            // observe it without waiting out the interval itself.
            var logger = new CapturingLogger<VehicleMaintenanceOverdueBackgroundService>();
            var services = new ServiceCollection();
            var result = new VehicleMaintenanceOverdueResult { MaintenancesUpdated = 3, VehiclesBlocked = 2 };
            services.AddScoped<IVehicleMaintenanceOverdueService>(
                _ => Mock.Of<IVehicleMaintenanceOverdueService>(s => s.RunOverdueUpdateAsync() == Task.FromResult(result))
            );
            var provider = services.BuildServiceProvider();

            var service = new VehicleMaintenanceOverdueBackgroundService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                logger,
                ConfigWithIntervalSeconds(3600)
            );

            await service.StartAsync(CancellationToken.None);
            await WaitUntil(() => logger.Messages.Any(m => m.Contains("Vehicle maintenance overdue update executed")));
            await service.StopAsync(CancellationToken.None);

            Assert.Contains(logger.Messages, m => m.Contains("VehicleMaintenanceOverdueBackgroundService started"));
            Assert.Contains(logger.Messages, m => m.Contains("Maintenances: 3") && m.Contains("VehiclesBlocked: 2"));
            Assert.Contains(logger.Messages, m => m.Contains("stopping"));
        }

        [Fact]
        public async Task ExecuteAsync_ShouldLogError_WhenServiceResolutionFails()
        {
            // GetRequiredService is called before ProcessOnceAsync's own try/catch, so a resolution
            // failure bubbles up and is caught by ExecuteAsync's outer catch instead - and since that
            // path never reaches the trailing Task.Delay, the first scope leaves the service
            // unregistered (throws once) while a second, correctly-registered provider backs every
            // call after that, so the loop can settle into its delay and be stopped cleanly instead
            // of spinning synchronously forever.
            var logger = new CapturingLogger<VehicleMaintenanceOverdueBackgroundService>();
            var providerWithoutRegistration = new ServiceCollection().BuildServiceProvider();
            var servicesWithRegistration = new ServiceCollection();
            servicesWithRegistration.AddScoped<IVehicleMaintenanceOverdueService>(
                _ => Mock.Of<IVehicleMaintenanceOverdueService>(
                    s => s.RunOverdueUpdateAsync() == Task.FromResult(new VehicleMaintenanceOverdueResult())
                )
            );
            var providerWithRegistration = servicesWithRegistration.BuildServiceProvider();

            var callCount = 0;
            var scopeFactoryMock = new Mock<IServiceScopeFactory>();
            scopeFactoryMock
                .Setup(f => f.CreateScope())
                .Returns(() =>
                {
                    callCount++;
                    return callCount == 1
                        ? providerWithoutRegistration.CreateScope()
                        : providerWithRegistration.CreateScope();
                });

            var service = new VehicleMaintenanceOverdueBackgroundService(
                scopeFactoryMock.Object,
                logger,
                ConfigWithIntervalSeconds(3600)
            );

            await service.StartAsync(CancellationToken.None);
            await WaitUntil(() => logger.Errors.Count > 0);
            await service.StopAsync(CancellationToken.None);

            Assert.Contains(
                logger.Errors,
                m => m.Contains("Error while running vehicle maintenance overdue update")
            );
        }

        [Fact]
        public async Task ExecuteAsync_ShouldLogError_WhenRunOverdueUpdateAsyncThrows()
        {
            var logger = new CapturingLogger<VehicleMaintenanceOverdueBackgroundService>();
            var services = new ServiceCollection();
            services.AddScoped<IVehicleMaintenanceOverdueService>(_ =>
            {
                var mock = new Mock<IVehicleMaintenanceOverdueService>();
                mock.Setup(s => s.RunOverdueUpdateAsync()).ThrowsAsync(new InvalidOperationException("boom"));
                return mock.Object;
            });
            var provider = services.BuildServiceProvider();

            var service = new VehicleMaintenanceOverdueBackgroundService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                logger,
                ConfigWithIntervalSeconds(3600)
            );

            await service.StartAsync(CancellationToken.None);
            await WaitUntil(() => logger.Errors.Count > 0);
            await service.StopAsync(CancellationToken.None);

            Assert.Contains(
                logger.Errors,
                m => m.Contains("Failed to execute vehicle maintenance overdue update via IVehicleMaintenanceOverdueService")
            );
        }

        [Fact]
        public async Task ExecuteAsync_ShouldLogError_WhenScopeCreationFails()
        {
            // CreateScope throws only on the first call - after that it delegates to a real scope
            // factory so the loop reaches its (long) Task.Delay and can be stopped cleanly, instead
            // of spinning synchronously forever (ProcessOnceAsync never awaits anything on this
            // failure path, so a mock that always throws would busy-loop the CPU indefinitely).
            var logger = new CapturingLogger<VehicleMaintenanceOverdueBackgroundService>();
            var services = new ServiceCollection();
            services.AddScoped<IVehicleMaintenanceOverdueService>(
                _ => Mock.Of<IVehicleMaintenanceOverdueService>(
                    s => s.RunOverdueUpdateAsync() == Task.FromResult(new VehicleMaintenanceOverdueResult())
                )
            );
            var realScopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

            var callCount = 0;
            var scopeFactoryMock = new Mock<IServiceScopeFactory>();
            scopeFactoryMock
                .Setup(f => f.CreateScope())
                .Returns(() =>
                {
                    callCount++;
                    return callCount == 1
                        ? throw new InvalidOperationException("scope failure")
                        : realScopeFactory.CreateScope();
                });

            var service = new VehicleMaintenanceOverdueBackgroundService(
                scopeFactoryMock.Object,
                logger,
                ConfigWithIntervalSeconds(3600)
            );

            await service.StartAsync(CancellationToken.None);
            await WaitUntil(() => logger.Errors.Count > 0);
            await service.StopAsync(CancellationToken.None);

            Assert.Contains(logger.Errors, m => m.Contains("Error while running vehicle maintenance overdue update"));
        }

        private static async Task WaitUntil(Func<bool> condition)
        {
            for (var i = 0; i < 50 && !condition(); i++)
            {
                await Task.Delay(20);
            }
        }

        private class CapturingLogger<T> : ILogger<T>
        {
            public List<string> Messages { get; } = new();
            public List<string> Errors { get; } = new();

            IDisposable ILogger.BeginScope<TState>(TState state) => NullScope.Instance;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter
            )
            {
                var message = formatter(state, exception);
                Messages.Add(message);
                if (logLevel == LogLevel.Error)
                {
                    Errors.Add(message);
                }
            }

            private class NullScope : IDisposable
            {
                public static readonly NullScope Instance = new();

                public void Dispose() { }
            }
        }
    }
}
