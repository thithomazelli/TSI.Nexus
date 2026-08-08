using System.Linq.Expressions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class VehicleMaintenanceServiceTests
    {
        private readonly VehicleMaintenanceService _service;
        private readonly Mock<IRepository<VehicleMaintenance>> _repository;
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly Guid _vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000010");

        public VehicleMaintenanceServiceTests()
        {
            _repository = new Mock<IRepository<VehicleMaintenance>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _logServiceMock = new Mock<ILogService>();
            _service = new VehicleMaintenanceService(
                _repository.Object,
                _vehicleRepository.Object,
                _logServiceMock.Object
            );
        }

        [Fact]
        public async Task VehicleMaintenanceService_Add_ShouldMarkAsOverdueAndBlockVehicle_WhenScheduledDateHasPassed()
        {
            // Arrange
            var vehicle = new Vehicle
            {
                Id = _vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Available,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Status = MaintenanceStatus.Scheduled,
                ScheduledDate = DateTime.UtcNow.Date.AddDays(-5),
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.Add(maintenance);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(MaintenanceStatus.Overdue, maintenance.Status);
            Assert.Equal(VehicleStatus.Blocked, vehicle.Status);
            _repository.Verify(_ => _.AddAsync(maintenance), Times.Once);
            _vehicleRepository.Verify(_ => _.UpdateAsync(vehicle), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceService_Add_ShouldNotBlockVehicle_WhenMaintenanceIsScheduledForTheFuture()
        {
            // Arrange
            var vehicle = new Vehicle
            {
                Id = _vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Available,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Status = MaintenanceStatus.Scheduled,
                ScheduledDate = DateTime.UtcNow.Date.AddDays(5),
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _service.Add(maintenance);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(MaintenanceStatus.Scheduled, maintenance.Status);
            Assert.Equal(VehicleStatus.Available, vehicle.Status);
            _vehicleRepository.Verify(_ => _.UpdateAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task VehicleMaintenanceService_Update_ShouldReleaseVehicle_WhenMaintenanceIsCompletedAndNoOtherPendingExists()
        {
            // Arrange
            var vehicle = new Vehicle
            {
                Id = _vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Blocked,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Status = MaintenanceStatus.Completed,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _service.Update(maintenance);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(maintenance.CompletedDate);
            Assert.Equal(VehicleStatus.Available, vehicle.Status);
            _vehicleRepository.Verify(_ => _.UpdateAsync(vehicle), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceService_Update_ShouldKeepVehicleBlocked_WhenOtherPendingMaintenanceExists()
        {
            // Arrange
            var vehicle = new Vehicle
            {
                Id = _vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Blocked,
            };
            var maintenance = new VehicleMaintenance
            {
                Id = Guid.NewGuid(),
                VehicleId = _vehicleId,
                Status = MaintenanceStatus.Completed,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { vehicle });
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.Update(maintenance);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(VehicleStatus.Blocked, vehicle.Status);
            _vehicleRepository.Verify(_ => _.UpdateAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task VehicleMaintenanceService_FindByVehicle_ShouldReturnMaintenancesForVehicle()
        {
            // Arrange
            var maintenances = new List<VehicleMaintenance>
            {
                new() { Id = Guid.NewGuid(), VehicleId = _vehicleId },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<VehicleMaintenance, bool>>>()))
                .ReturnsAsync(maintenances);

            // Act
            var result = await _service.FindByVehicle(_vehicleId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(maintenances, result.Data);
        }
    }
}
