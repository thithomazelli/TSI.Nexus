using Microsoft.Extensions.Configuration;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Repository.Overdue;
using TSI.Nexus.Services.Services;

namespace TSI.Nexus.Services.Tests.Services
{
    public class OverdueServiceTests
    {
        private readonly Mock<IOverdueRepository> _repo;
        private readonly Mock<IAlertConfigService> _alertConfigService;
        private readonly Mock<IConfiguration> _configuration;

        public OverdueServiceTests()
        {
            _repo = new Mock<IOverdueRepository>();
            _alertConfigService = new Mock<IAlertConfigService>();
            _configuration = new Mock<IConfiguration>();
        }

        private OverdueService CreateService()
        {
            return new OverdueService(_repo.Object, _alertConfigService.Object, _configuration.Object);
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldReturnZero_WhenAlertIsDisabled()
        {
            // Arrange
            _alertConfigService
                .Setup(_ => _.IsEnabledAsync(AlertConfigKeys.DashboardOverdueReturns))
                .ReturnsAsync(false);
            var service = CreateService();

            // Act
            var result = await service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(0, result.PaymentsUpdated);
            _repo.Verify(_ => _.MarkOverduePaymentsAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldMarkOverduePayments_WhenAlertIsEnabled()
        {
            // Arrange
            _alertConfigService
                .Setup(_ => _.IsEnabledAsync(AlertConfigKeys.DashboardOverdueReturns))
                .ReturnsAsync(true);
            _repo.Setup(_ => _.MarkOverduePaymentsAsync(It.IsAny<string>())).ReturnsAsync(5);
            var service = CreateService();

            // Act
            var result = await service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(5, result.PaymentsUpdated);
            _repo.Verify(_ => _.MarkOverduePaymentsAsync("overdue-batch"), Times.Once);
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldUseConfiguredSystemUserId_WhenConfigurationHasValue()
        {
            // Arrange
            _configuration.Setup(_ => _["OverdueSystemUserId"]).Returns("custom-user-id");
            _alertConfigService
                .Setup(_ => _.IsEnabledAsync(AlertConfigKeys.DashboardOverdueReturns))
                .ReturnsAsync(true);
            _repo.Setup(_ => _.MarkOverduePaymentsAsync(It.IsAny<string>())).ReturnsAsync(2);
            var service = CreateService();

            // Act
            var result = await service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(2, result.PaymentsUpdated);
            _repo.Verify(_ => _.MarkOverduePaymentsAsync("custom-user-id"), Times.Once);
        }
    }
}
