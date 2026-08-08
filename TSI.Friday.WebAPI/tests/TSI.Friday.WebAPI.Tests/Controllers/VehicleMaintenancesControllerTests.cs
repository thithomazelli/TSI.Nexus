using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class VehicleMaintenancesControllerTests
    {
        private readonly VehicleMaintenancesController _controller;
        private readonly Mock<IVehicleMaintenanceService> _serviceMock;

        public VehicleMaintenancesControllerTests()
        {
            _serviceMock = new Mock<IVehicleMaintenanceService>();
            _controller = new VehicleMaintenancesController(_serviceMock.Object);
        }

        [Fact]
        public async Task VehicleMaintenancesController_Add_ShouldAddMaintenanceSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var maintenanceMock = new VehicleMaintenance
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                VehicleId = Guid.NewGuid(),
                Type = MaintenanceType.Preventive,
            };

            var expectedResult = new WebApiResponse<VehicleMaintenance>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = "Manutenção cadastrada com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<VehicleMaintenance>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(maintenanceMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenance>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(maintenanceMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<VehicleMaintenance>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenancesController_Add_ShouldNotAddMaintenance_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var maintenanceMock = new VehicleMaintenance();

            _controller.ModelState.AddModelError("VehicleId", "VehicleId is required");

            // Act
            var result = await _controller.Add(maintenanceMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("VehicleId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<VehicleMaintenance>()), Times.Never);
        }

        [Fact]
        public async Task VehicleMaintenancesController_Update_ShouldUpdateMaintenanceSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var maintenanceMock = new VehicleMaintenance
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                VehicleId = Guid.NewGuid(),
            };

            var expectedResult = new WebApiResponse<VehicleMaintenance>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = "Manutenção atualizada com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<VehicleMaintenance>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(maintenanceMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenance>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<VehicleMaintenance>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenancesController_Remove_ShouldRemoveMaintenanceSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var maintenanceMock = new VehicleMaintenance
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                VehicleId = Guid.NewGuid(),
            };

            var expectedResult = new WebApiResponse<VehicleMaintenance>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = "Manutenção removida com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<VehicleMaintenance>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(maintenanceMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenance>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<VehicleMaintenance>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenancesController_GetAll_ShouldGetAllMaintenances_WhenMethodIsCalled()
        {
            // Arrange
            var maintenanceMock = new List<VehicleMaintenance>
            {
                new() { Id = Guid.NewGuid(), VehicleId = Guid.NewGuid() },
            };

            var expectedResult = new WebApiResponse<IEnumerable<VehicleMaintenance>>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = $"{maintenanceMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<VehicleMaintenance>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(maintenanceMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenancesController_GetById_ShouldGetMaintenanceById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var maintenanceMock = new VehicleMaintenance { Id = idMock, VehicleId = Guid.NewGuid() };

            var expectedResult = new WebApiResponse<VehicleMaintenance>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = "Manutenção encontrada com sucesso",
            };

            _serviceMock
                .Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenance>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(maintenanceMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenancesController_GetByVehicle_ShouldGetMaintenancesForVehicle_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var maintenanceMock = new List<VehicleMaintenance>
            {
                new() { Id = Guid.NewGuid(), VehicleId = vehicleId },
            };

            var expectedResult = new WebApiResponse<IEnumerable<VehicleMaintenance>>
            {
                Data = maintenanceMock,
                Status = ResponseStatus.Success,
                Message = $"{maintenanceMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByVehicle(It.IsAny<Guid>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicle(vehicleId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<VehicleMaintenance>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(maintenanceMock, response.Data);

            _serviceMock.Verify(_ => _.FindByVehicle(It.IsAny<Guid>()), Times.Once);
        }
    }
}
