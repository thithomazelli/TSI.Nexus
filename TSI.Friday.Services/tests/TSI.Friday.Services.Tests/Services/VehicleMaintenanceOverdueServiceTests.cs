using System.Linq.Expressions;
using Microsoft.Extensions.Configuration;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Services.Tests.Services
{
    public class VehicleMaintenanceOverdueServiceTests
    {
        private readonly VehicleMaintenanceOverdueService _service;
        private readonly Mock<IRepository<VehicleMaintenance>> _maintenanceRepository;
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<IConfiguration> _configuration;

        public VehicleMaintenanceOverdueServiceTests()
        {
            _maintenanceRepository = new Mock<IRepository<VehicleMaintenance>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _configuration = new Mock<IConfiguration>();
            _configuration.Setup(_ => _[It.IsAny<string>()]).Returns((string)null);

            _service = new VehicleMaintenanceOverdueService(
                _maintenanceRepository.Object,
                _vehicleRepository.Object,
                _configuration.Object
            );
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldMarkOverdueAndBlockVehicle_WhenScheduledDateHasPassed()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000010");
            var vehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Available,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                Status = MaintenanceStatus.Scheduled,
                ScheduledDate = DateTime.UtcNow.Date.AddDays(-3),
            };

            _maintenanceRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(new List<VehicleMaintenance> { maintenance });
            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });

            // Act
            var result = await _service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(1, result.MaintenancesUpdated);
            Assert.Equal(1, result.VehiclesBlocked);
            Assert.Equal(MaintenanceStatus.Overdue, maintenance.Status);
            Assert.Equal(VehicleStatus.Blocked, vehicle.Status);
            _maintenanceRepository.Verify(_ => _.UpdateAsync(maintenance), Times.Once);
            _vehicleRepository.Verify(_ => _.UpdateAsync(vehicle), Times.Once);
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldNotBlockVehicle_WhenAlreadyBlockedOrInactive()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000011");
            var vehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "XYZ9E87",
                Status = VehicleStatus.Inactive,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                Status = MaintenanceStatus.Scheduled,
                ScheduledDate = DateTime.UtcNow.Date.AddDays(-3),
            };

            _maintenanceRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(new List<VehicleMaintenance> { maintenance });
            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });

            // Act
            var result = await _service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(1, result.MaintenancesUpdated);
            Assert.Equal(0, result.VehiclesBlocked);
            _vehicleRepository.Verify(_ => _.UpdateAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task RunOverdueUpdateAsync_ShouldReturnZero_WhenNoMaintenanceIsOverdue()
        {
            // Arrange
            _maintenanceRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(new List<VehicleMaintenance>());

            // Act
            var result = await _service.RunOverdueUpdateAsync();

            // Assert
            Assert.Equal(0, result.MaintenancesUpdated);
            Assert.Equal(0, result.VehiclesBlocked);
            _vehicleRepository.Verify(
                _ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()),
                Times.Never
            );
        }
    }
}
