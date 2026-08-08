using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class VehiclesControllerTests
    {
        private readonly VehiclesController _vehiclesController;
        private readonly Mock<IVehicleService> _vehicleServiceMock;

        public VehiclesControllerTests()
        {
            _vehicleServiceMock = new Mock<IVehicleService>();
            _vehiclesController = new VehiclesController(_vehicleServiceMock.Object);
        }

        [Fact]
        public async Task VehiclesController_Add_ShouldAddVehicleSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
                Brand = "Mercedes-Benz",
                SeatCapacity = 46,
            };

            var expectedResult = new WebApiResponse<Vehicle>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"Veículo {vehicleMock.Plate} cadastrado com sucesso.",
            };

            _vehicleServiceMock.Setup(_ => _.Add(It.IsAny<Vehicle>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.Add(vehicleMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Vehicle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(vehicleMock, response.Data);

            _vehicleServiceMock.Verify(_ => _.Add(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_Add_ShouldNotAddVehicleSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var vehicleMock = new Vehicle();

            _vehiclesController.ModelState.AddModelError("Plate", "Plate is required");

            // Act
            var result = await _vehiclesController.Add(vehicleMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Plate"));

            _vehicleServiceMock.Verify(_ => _.Add(It.IsAny<Vehicle>()), Times.Never);
        }

        [Fact]
        public async Task VehiclesController_Update_ShouldUpdateVehicleSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            var expectedResult = new WebApiResponse<Vehicle>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"Veículo {vehicleMock.Plate} atualizado com sucesso.",
            };

            _vehicleServiceMock
                .Setup(_ => _.Update(It.IsAny<Vehicle>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.Update(vehicleMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Vehicle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _vehicleServiceMock.Verify(_ => _.Update(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_Remove_ShouldRemoveVehicleSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var vehicleMock = new Vehicle
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Plate = "ABC1D23",
            };

            var expectedResult = new WebApiResponse<Vehicle>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"Veículo {vehicleMock.Plate} removido com sucesso.",
            };

            _vehicleServiceMock
                .Setup(_ => _.Remove(It.IsAny<Vehicle>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.Remove(vehicleMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Vehicle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _vehicleServiceMock.Verify(_ => _.Remove(It.IsAny<Vehicle>()), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_GetAll_ShouldGetAllVehicles_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleMock = new List<Vehicle>
            {
                new() { Id = Guid.NewGuid(), Plate = "ABC1D23" },
                new() { Id = Guid.NewGuid(), Plate = "XYZ9E87" },
            };

            var expectedResult = new WebApiResponse<IEnumerable<Vehicle>>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"{vehicleMock.Count} registro(s) encontrado(s).",
            };

            _vehicleServiceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Vehicle>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(vehicleMock, response.Data);

            _vehicleServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_GetById_ShouldGetVehicleById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var vehicleMock = new Vehicle { Id = idMock, Plate = "ABC1D23" };

            var expectedResult = new WebApiResponse<Vehicle>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"Veículo {vehicleMock.Plate} encontrado com sucesso",
            };

            _vehicleServiceMock
                .Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Vehicle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(vehicleMock, response.Data);

            _vehicleServiceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_GetByPlate_ShouldGetVehicleByPlate_WhenMethodIsCalled()
        {
            // Arrange
            var plateMock = "ABC1D23";
            var vehicleMock = new Vehicle { Id = Guid.NewGuid(), Plate = plateMock };

            var expectedResult = new WebApiResponse<Vehicle>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"Veículo {vehicleMock.Plate} encontrado com sucesso",
            };

            _vehicleServiceMock
                .Setup(_ => _.FindByPlate(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.GetByPlate(plateMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Vehicle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(vehicleMock, response.Data);

            _vehicleServiceMock.Verify(_ => _.FindByPlate(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task VehiclesController_GetAvailable_ShouldGetOnlyAvailableVehicles_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleMock = new List<Vehicle>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Plate = "ABC1D23",
                    Status = VehicleStatus.Available,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<Vehicle>>
            {
                Data = vehicleMock,
                Status = ResponseStatus.Success,
                Message = $"{vehicleMock.Count} registro(s) encontrado(s).",
            };

            _vehicleServiceMock.Setup(_ => _.FindAvailable()).ReturnsAsync(expectedResult);

            // Act
            var result = await _vehiclesController.GetAvailable();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Vehicle>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(vehicleMock, response.Data);

            _vehicleServiceMock.Verify(_ => _.FindAvailable(), Times.Once);
        }
    }
}
