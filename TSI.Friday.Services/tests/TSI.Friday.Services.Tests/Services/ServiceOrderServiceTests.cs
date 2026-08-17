using System.Linq.Expressions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class ServiceOrderServiceTests
    {
        private readonly ServiceOrderService _service;
        private readonly Mock<IRepository<ServiceOrder>> _repository;
        private readonly Mock<IRepository<Commission>> _commissionRepository;
        private readonly Mock<IRepository<Driver>> _driverRepository;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logServiceMock;

        public ServiceOrderServiceTests()
        {
            _repository = new Mock<IRepository<ServiceOrder>>();
            _commissionRepository = new Mock<IRepository<Commission>>();
            _driverRepository = new Mock<IRepository<Driver>>();
            _sequenceService = new Mock<ISequenceService>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _logServiceMock = new Mock<ILogService>();
            _service = new ServiceOrderService(
                _repository.Object,
                _commissionRepository.Object,
                _driverRepository.Object,
                _sequenceService.Object,
                _featureToggleServiceMock.Object,
                _logServiceMock.Object
            );

            _sequenceService.Setup(_ => _.GetNextValue("ServiceOrderNumberSeq")).ReturnsAsync(1);
        }

        [Fact]
        public async Task ServiceOrderService_GenerateForTrip_ShouldReturnWarning_WhenTripHasNoDriver()
        {
            // Arrange
            var trip = new Trip { Id = Guid.NewGuid(), TripNumber = "VIA-001", DriverId = null };

            // Act
            var result = await _service.GenerateForTrip(trip);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.AddAsync(It.IsAny<ServiceOrder>()), Times.Never);
        }

        [Fact]
        public async Task ServiceOrderService_GenerateForTrip_ShouldReturnWarning_WhenFleetModuleDisabled()
        {
            // Arrange
            var trip = new Trip
            {
                Id = Guid.NewGuid(),
                TripNumber = "VIA-001",
                DriverId = Guid.NewGuid(),
                TotalPrice = 1000,
            };

            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _service.GenerateForTrip(trip);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.AddAsync(It.IsAny<ServiceOrder>()), Times.Never);
        }

        [Fact]
        public async Task ServiceOrderService_GenerateForTrip_ShouldReturnWarning_WhenServiceOrderAlreadyExistsForTrip()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var trip = new Trip
            {
                Id = Guid.NewGuid(),
                TripNumber = "VIA-001",
                DriverId = driverId,
                TotalPrice = 1000,
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<ServiceOrder, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.GenerateForTrip(trip);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.AddAsync(It.IsAny<ServiceOrder>()), Times.Never);
        }

        [Fact]
        public async Task ServiceOrderService_GenerateForTrip_ShouldCreateServiceOrderAndCommission_WhenDataIsValid()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var trip = new Trip
            {
                Id = Guid.NewGuid(),
                TripNumber = "VIA-001",
                DriverId = driverId,
                TotalPrice = 1000,
            };
            var driver = new Driver
            {
                Id = driverId,
                Name = "João da Silva",
                CommissionPercentage = 10,
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<ServiceOrder, bool>>>()))
                .ReturnsAsync(false);
            _driverRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(new List<Driver> { driver });

            // Act
            var result = await _service.GenerateForTrip(trip);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("OS-00001", result.Data!.Number);
            Assert.NotNull(result.Data.Commission);
            Assert.Equal(100, result.Data.Commission!.Amount); // 1000 * 10%
            _repository.Verify(_ => _.AddAsync(It.IsAny<ServiceOrder>()), Times.Once);
            _commissionRepository.Verify(_ => _.AddAsync(It.IsAny<Commission>()), Times.Once);
        }

        [Fact]
        public async Task ServiceOrderService_GenerateForTrip_ShouldReturnWarning_WhenDriverIsNotFound()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var trip = new Trip
            {
                Id = Guid.NewGuid(),
                TripNumber = "VIA-001",
                DriverId = driverId,
                TotalPrice = 1000,
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<ServiceOrder, bool>>>()))
                .ReturnsAsync(false);
            _driverRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(new List<Driver>());

            // Act
            var result = await _service.GenerateForTrip(trip);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.AddAsync(It.IsAny<ServiceOrder>()), Times.Never);
        }

        [Fact]
        public async Task ServiceOrderService_FindByDriver_ShouldReturnServiceOrdersForDriver()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var serviceOrders = new List<ServiceOrder>
            {
                new() { Id = Guid.NewGuid(), DriverId = driverId, Number = "OS-00001" },
            };

            _repository
                .Setup(_ =>
                    _.QueryAsync(
                        It.IsAny<Expression<Func<ServiceOrder, bool>>>(),
                        It.IsAny<Expression<Func<ServiceOrder, object>>[]>()
                    )
                )
                .ReturnsAsync(serviceOrders);

            // Act
            var result = await _service.FindByDriver(driverId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(serviceOrders, result.Data);
        }
    }
}
