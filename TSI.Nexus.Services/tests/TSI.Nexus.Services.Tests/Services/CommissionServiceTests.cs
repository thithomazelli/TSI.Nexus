using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Services.Tests.Services
{
    public class CommissionServiceTests
    {
        private readonly CommissionService _service;
        private readonly Mock<IRepository<Commission>> _repository;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logServiceMock;

        public CommissionServiceTests()
        {
            _repository = new Mock<IRepository<Commission>>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _featureToggleServiceMock
                            .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
                            .ReturnsAsync(true);
            _logServiceMock = new Mock<ILogService>();
            _service = new CommissionService(
                _repository.Object,
                _featureToggleServiceMock.Object,
                _logServiceMock.Object
            );
        }

        [Fact]
        public async Task CommissionService_Update_ShouldSetPaidDate_WhenStatusChangesToPaid()
        {
            // Arrange
            var commission = new Commission
            {
                Id = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
                ServiceOrderId = Guid.NewGuid(),
                Status = CommissionStatus.Paid,
            };

            // Act
            var result = await _service.Update(commission);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(commission.PaidDate);
            _repository.Verify(_ => _.UpdateAsync(commission), Times.Once);
        }

        [Fact]
        public async Task CommissionService_Update_ShouldNotSetPaidDate_WhenStatusIsPending()
        {
            // Arrange
            var commission = new Commission
            {
                Id = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
                ServiceOrderId = Guid.NewGuid(),
                Status = CommissionStatus.Pending,
            };

            // Act
            await _service.Update(commission);

            // Assert
            Assert.Null(commission.PaidDate);
        }

        [Fact]
        public async Task CommissionService_Update_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var commission = new Commission { Id = Guid.NewGuid(), Status = CommissionStatus.Pending };
            _repository.Setup(_ => _.UpdateAsync(commission)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Update(commission);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logServiceMock.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "CommissionService.Update", commission),
                Times.Once
            );
        }

        [Fact]
        public async Task CommissionService_FindByDriver_ShouldReturnCommissionsForDriver()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var commissions = new List<Commission>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    DriverId = driverId,
                    ServiceOrderId = Guid.NewGuid(),
                },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Commission, bool>>>()))
                .ReturnsAsync(commissions);

            // Act
            var result = await _service.FindByDriver(driverId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(commissions, result.Data);
        }

        [Fact]
        public async Task CommissionService_FindByDriver_ShouldReturnEmpty_WhenFeatureToggleIsDisabled()
        {
            // Arrange
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Commission, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _service.FindByDriver(Guid.NewGuid());

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data!);
            Assert.Equal("0 registro(s) encontrado(s).", result.Message);
            _repository.Verify(
                _ => _.QueryAsync(It.IsAny<Expression<Func<Commission, bool>>>()),
                Times.Never
            );
        }

        [Fact]
        public async Task CommissionService_FindByDriver_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Commission, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByDriver(Guid.NewGuid());

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task CommissionService_FindById_ShouldReturnCommission_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var commission = new Commission
            {
                Id = id,
                DriverId = Guid.NewGuid(),
                ServiceOrderId = Guid.NewGuid(),
            };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(commission);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(commission, result.Data);
        }

        [Fact]
        public async Task CommissionService_FindById_ShouldReturnNoData_WhenNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync((Commission)null!);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhuma comissão com o ID {id} foi encontrada", result.Message);
        }

        [Fact]
        public async Task CommissionService_FindById_ShouldReturnNoData_WhenFeatureToggleIsDisabled()
        {
            // Arrange
            var id = Guid.NewGuid();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Commission, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            _repository.Verify(_ => _.GetByIdAsync(id), Times.Never);
        }

        [Fact]
        public async Task CommissionService_FindById_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository.Setup(_ => _.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }
    }
}
