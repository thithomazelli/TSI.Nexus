using System.Linq.Expressions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class FuelLogServiceTests
    {
        private readonly FuelLogService _service;
        private readonly Mock<IRepository<FuelLog>> _repository;
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly Guid _vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000010");

        public FuelLogServiceTests()
        {
            _repository = new Mock<IRepository<FuelLog>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _logServiceMock = new Mock<ILogService>();
            _service = new FuelLogService(
                _repository.Object,
                _vehicleRepository.Object,
                _featureToggleServiceMock.Object,
                _logServiceMock.Object
            );
        }

        [Fact]
        public async Task FuelLogService_Add_ShouldCalculateTotalCost_WhenNotInformed()
        {
            // Arrange
            var vehicle = new Vehicle { Id = _vehicleId, Plate = "ABC1D23", Odometer = 1000 };
            var fuelLog = new FuelLog
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Liters = 50,
                PricePerLiter = 6,
                Odometer = 1500,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });

            // Act
            var result = await _service.Add(fuelLog);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(300, fuelLog.TotalCost);
            _repository.Verify(_ => _.AddAsync(fuelLog), Times.Once);
        }

        [Fact]
        public async Task FuelLogService_Add_ShouldUpdateVehicleOdometer_WhenReadingIsHigherThanCurrent()
        {
            // Arrange
            var vehicle = new Vehicle { Id = _vehicleId, Plate = "ABC1D23", Odometer = 1000 };
            var fuelLog = new FuelLog
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Liters = 50,
                PricePerLiter = 6,
                Odometer = 1500,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });

            // Act
            await _service.Add(fuelLog);

            // Assert
            Assert.Equal(1500, vehicle.Odometer);
            _vehicleRepository.Verify(_ => _.UpdateAsync(vehicle), Times.Once);
        }

        [Fact]
        public async Task FuelLogService_Add_ShouldNotUpdateVehicleOdometer_WhenReadingIsLowerThanCurrent()
        {
            // Arrange
            var vehicle = new Vehicle { Id = _vehicleId, Plate = "ABC1D23", Odometer = 2000 };
            var fuelLog = new FuelLog
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Liters = 50,
                PricePerLiter = 6,
                Odometer = 1500,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });

            // Act
            await _service.Add(fuelLog);

            // Assert
            Assert.Equal(2000, vehicle.Odometer);
            _vehicleRepository.Verify(_ => _.UpdateAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task FuelLogService_Update_ShouldUpdateFuelLogSuccessfully()
        {
            // Arrange
            var fuelLog = new FuelLog { Id = Guid.NewGuid(), VehicleId = _vehicleId };

            // Act
            var result = await _service.Update(fuelLog);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(fuelLog), Times.Once);
        }

        [Fact]
        public async Task FuelLogService_Remove_ShouldRemoveFuelLogSuccessfully()
        {
            // Arrange
            var fuelLog = new FuelLog { Id = Guid.NewGuid(), VehicleId = _vehicleId };

            // Act
            var result = await _service.Remove(fuelLog);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(fuelLog), Times.Once);
        }

        [Fact]
        public async Task FuelLogService_FindByVehicle_ShouldReturnLogsForVehicle()
        {
            // Arrange
            var logs = new List<FuelLog> { new() { Id = Guid.NewGuid(), VehicleId = _vehicleId } };
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<FuelLog, bool>>>()))
                .ReturnsAsync(logs);

            // Act
            var result = await _service.FindByVehicle(_vehicleId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(logs, result.Data);
        }
    }
}
