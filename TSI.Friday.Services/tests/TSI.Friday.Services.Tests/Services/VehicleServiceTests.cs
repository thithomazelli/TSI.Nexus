using System.Linq.Expressions;
using FluentAssertions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class VehicleServiceTests
    {
        private readonly VehicleService _vehicleService;
        private readonly Mock<IRepository<Vehicle>> _repository;
        private readonly Mock<IRepository<Order>> _orderRepositoryMock;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly IList<Vehicle> _vehicleListMock;

        public VehicleServiceTests()
        {
            _repository = new Mock<IRepository<Vehicle>>();
            _orderRepositoryMock = new Mock<IRepository<Order>>();
            _logServiceMock = new Mock<ILogService>();
            _vehicleService = new VehicleService(
                _repository.Object,
                _orderRepositoryMock.Object,
                _logServiceMock.Object
            );

            _vehicleListMock = new List<Vehicle>
            {
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Plate = "ABC1D23",
                    Brand = "Mercedes-Benz",
                    Model = "O500",
                    SeatCapacity = 46,
                    Type = VehicleType.Bus,
                    Status = VehicleStatus.Available,
                },
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Plate = "XYZ9E87",
                    Brand = "Volkswagen",
                    Model = "9.160",
                    SeatCapacity = 28,
                    Type = VehicleType.MiniBus,
                    Status = VehicleStatus.Blocked,
                },
            };
        }

        [Fact]
        public async Task VehicleService_Add_ShouldAddVehicleSuccessfully_WhenPlateIsNotDuplicated()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _vehicleService.Add(vehicleMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(vehicleMock, result.Data);
            Assert.Equal($"Veículo {vehicleMock.Plate} cadastrado com sucesso.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehicleService_Add_ShouldNotAddVehicleAndReturnAnErrorMessage_WhenPlateIsDuplicated()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _vehicleService.Add(vehicleMock);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal(
                $"Já existe um Veículo cadastrado com a placa {vehicleMock.Plate}.",
                result.Message
            );
            _repository.Verify(_ => _.AddAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task VehicleService_Update_ShouldUpdateVehicleSuccessfully_WhenPlateIsNotDuplicated()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _vehicleService.Update(vehicleMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"Veículo {vehicleMock.Plate} atualizado com sucesso.", result.Message);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehicleService_Remove_ShouldReturnWarning_WhenVehicleIsLinkedToOrders()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            _orderRepositoryMock
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _vehicleService.Remove(vehicleMock);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task VehicleService_Remove_ShouldRemoveVehicleSuccessfully_WhenNotLinkedToOrders()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            _orderRepositoryMock
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _vehicleService.Remove(vehicleMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehicleService_FindAll_ShouldReturnAllVehicles()
        {
            // Arrange
            _repository.Setup(_ => _.GetAllAsync()).ReturnsAsync(_vehicleListMock);

            // Act
            var result = await _vehicleService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(_vehicleListMock, result.Data);
        }

        [Fact]
        public async Task VehicleService_FindById_ShouldReturnVehicle_WhenIdIsValid()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var vehicleMock = _vehicleListMock.First(_ => idMock.Equals(_.Id));

            _repository.Setup(_ => _.GetByIdAsync(idMock)).ReturnsAsync(vehicleMock);

            // Act
            var result = await _vehicleService.FindById(idMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(vehicleMock, result.Data);
        }

        [Fact]
        public async Task VehicleService_FindByPlate_ShouldReturnVehicle_WhenPlateIsValid()
        {
            // Arrange
            const string plateMock = "ABC1D23";
            var vehicleMock = _vehicleListMock.First(_ => plateMock.Equals(_.Plate));

            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(vehicleMock);

            // Act
            var result = await _vehicleService.FindByPlate(plateMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(vehicleMock, result.Data);
        }

        [Fact]
        public async Task VehicleService_FindAvailable_ShouldReturnOnlyAvailableVehicles()
        {
            // Arrange
            var availableOnly = _vehicleListMock.Where(v => v.Status == VehicleStatus.Available).ToList();

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(availableOnly);

            // Act
            var result = await _vehicleService.FindAvailable();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(availableOnly, result.Data);
        }

        [Fact]
        public async Task VehicleService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            _repository.Setup(_ => _.GetAllAsync()).ThrowsAsync(exception);

            // Act
            var result = await _vehicleService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal(
                $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {exception.Message}",
                result.Message
            );
        }
    }
}
