using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class FuelLogsControllerTests
    {
        private readonly FuelLogsController _controller;
        private readonly Mock<IFuelLogService> _serviceMock;

        public FuelLogsControllerTests()
        {
            _serviceMock = new Mock<IFuelLogService>();
            _controller = new FuelLogsController(_serviceMock.Object);
        }

        [Fact]
        public async Task FuelLogsController_Add_ShouldAddFuelLogSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var fuelLogMock = new FuelLog { Id = Guid.NewGuid(), VehicleId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<FuelLog>
            {
                Data = fuelLogMock,
                Status = ResponseStatus.Success,
                Message = "Abastecimento cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<FuelLog>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(fuelLogMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<FuelLog>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Add(It.IsAny<FuelLog>()), Times.Once);
        }

        [Fact]
        public async Task FuelLogsController_Add_ShouldNotAddFuelLog_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var fuelLogMock = new FuelLog();
            _controller.ModelState.AddModelError("VehicleId", "VehicleId is required");

            // Act
            var result = await _controller.Add(fuelLogMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("VehicleId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<FuelLog>()), Times.Never);
        }

        [Fact]
        public async Task FuelLogsController_Update_ShouldUpdateFuelLogSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var fuelLogMock = new FuelLog { Id = Guid.NewGuid(), VehicleId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<FuelLog>
            {
                Data = fuelLogMock,
                Status = ResponseStatus.Success,
                Message = "Abastecimento atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<FuelLog>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(fuelLogMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<FuelLog>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<FuelLog>()), Times.Once);
        }

        [Fact]
        public async Task FuelLogsController_Remove_ShouldRemoveFuelLogSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var fuelLogMock = new FuelLog { Id = Guid.NewGuid(), VehicleId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<FuelLog>
            {
                Data = fuelLogMock,
                Status = ResponseStatus.Success,
                Message = "Abastecimento removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<FuelLog>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(fuelLogMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<FuelLog>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<FuelLog>()), Times.Once);
        }

        [Fact]
        public async Task FuelLogsController_GetByVehicle_ShouldGetFuelLogsForVehicle_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var fuelLogsMock = new List<FuelLog> { new() { Id = Guid.NewGuid(), VehicleId = vehicleId } };
            var expectedResult = new WebApiResponse<IEnumerable<FuelLog>>
            {
                Data = fuelLogsMock,
                Status = ResponseStatus.Success,
                Message = $"{fuelLogsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByVehicle(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicle(vehicleId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<FuelLog>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(fuelLogsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByVehicle(It.IsAny<Guid>()), Times.Once);
        }
    }
}
