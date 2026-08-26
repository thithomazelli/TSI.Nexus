using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Services.Services;

namespace TSI.Nexus.Services.Tests.Services
{
    public class OverdueStatusBackgroundServiceTests
    {
        private static IConfiguration EmptyConfig() =>
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();

        [Theory]
        [InlineData("2026-08-26T00:00:00Z", 24)]
        [InlineData("2026-08-26T10:00:00Z", 14)]
        [InlineData("2026-08-26T23:59:59Z", 0)] // 1 second left, rounds down to 0 whole hours
        public void GetDelayUntilNextMidnightUtc_ShouldReturnTimeRemainingUntilNextMidnight(
            string nowIso,
            int expectedHours
        )
        {
            var now = DateTimeOffset.Parse(nowIso).UtcDateTime;

            var delay = OverdueStatusBackgroundService.GetDelayUntilNextMidnightUtc(now);

            Assert.Equal(expectedHours, (int)delay.TotalHours);
            Assert.True(delay >= TimeSpan.Zero);
            Assert.True(delay <= TimeSpan.FromDays(1));
        }

        [Fact]
        public async Task ExecuteAsync_ShouldLogStartAndStop_WhenStoppedImmediately()
        {
            var logger = new CapturingLogger<OverdueStatusBackgroundService>();
            var services = new ServiceCollection();
            services.AddScoped<IOverdueService>(
                _ => Mock.Of<IOverdueService>(s => s.RunOverdueUpdateAsync() == Task.FromResult(new OverdueResult()))
            );
            var provider = services.BuildServiceProvider();

            var service = new OverdueStatusBackgroundService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                logger,
                EmptyConfig()
            );

            await service.StartAsync(CancellationToken.None);
            await service.StopAsync(CancellationToken.None);

            // The scheduled delay always waits for the next UTC midnight, so within the short life
            // of this test StopAsync's cancellation is what ends the loop - the actual overdue
            // update call is exercised separately via IOverdueService's own unit tests.
            Assert.Contains(logger.Messages, m => m.Contains("started, scheduled daily at midnight UTC"));
            Assert.Contains(logger.Messages, m => m.Contains("Next overdue run scheduled in"));
            Assert.Contains(logger.Messages, m => m.Contains("stopping"));
        }

        private class CapturingLogger<T> : ILogger<T>
        {
            public List<string> Messages { get; } = new();

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
                Messages.Add(formatter(state, exception));
            }

            private class NullScope : IDisposable
            {
                public static readonly NullScope Instance = new();

                public void Dispose() { }
            }
        }
    }
}
