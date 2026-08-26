using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class VehicleMaintenanceProductsControllerTests
    {
        private readonly VehicleMaintenanceProductsController _controller;
        private readonly Mock<IVehicleMaintenanceProductService> _serviceMock;

        public VehicleMaintenanceProductsControllerTests()
        {
            _serviceMock = new Mock<IVehicleMaintenanceProductService>();
            _controller = new VehicleMaintenanceProductsController(_serviceMock.Object);
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_Add_ShouldAddVehicleMaintenanceProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new VehicleMaintenanceProductDto
            {
                Id = Guid.NewGuid(),
                VehicleMaintenanceId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto da manutenção cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<VehicleMaintenanceProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenanceProductDto>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<VehicleMaintenanceProductDto>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_Add_ShouldNotAddVehicleMaintenanceProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new VehicleMaintenanceProductDto();
            _controller.ModelState.AddModelError(
                "VehicleMaintenanceId",
                "VehicleMaintenanceId is required"
            );

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("VehicleMaintenanceId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<VehicleMaintenanceProductDto>()), Times.Never);
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_Update_ShouldUpdateVehicleMaintenanceProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new VehicleMaintenanceProductDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto da manutenção atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<VehicleMaintenanceProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenanceProductDto>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(
                _ => _.Update(It.IsAny<VehicleMaintenanceProductDto>()),
                Times.Once
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_Update_ShouldNotUpdateVehicleMaintenanceProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new VehicleMaintenanceProductDto();
            _controller.ModelState.AddModelError(
                "VehicleMaintenanceId",
                "VehicleMaintenanceId is required"
            );

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("VehicleMaintenanceId"));

            _serviceMock.Verify(
                _ => _.Update(It.IsAny<VehicleMaintenanceProductDto>()),
                Times.Never
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_Remove_ShouldRemoveVehicleMaintenanceProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new VehicleMaintenanceProductDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto da manutenção removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<VehicleMaintenanceProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenanceProductDto>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(
                _ => _.Remove(It.IsAny<VehicleMaintenanceProductDto>()),
                Times.Once
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_GetAll_ShouldGetAllVehicleMaintenanceProducts_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<VehicleMaintenanceProductDto>
            {
                new() { Id = Guid.NewGuid() },
            };
            var expectedResult = new WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<
                WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            >(okResult.Value);
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_GetByVehicleMaintenanceId_ShouldGetVehicleMaintenanceProductsForMaintenance_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleMaintenanceId = Guid.NewGuid();
            var listMock = new List<VehicleMaintenanceProductDto>
            {
                new() { Id = Guid.NewGuid(), VehicleMaintenanceId = vehicleMaintenanceId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByVehicleMaintenanceId(vehicleMaintenanceId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicleMaintenanceId(vehicleMaintenanceId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<
                WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            >(okResult.Value);
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(
                _ => _.FindByVehicleMaintenanceId(vehicleMaintenanceId),
                Times.Once
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_GetByProductId_ShouldGetVehicleMaintenanceProductsForProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var listMock = new List<VehicleMaintenanceProductDto>
            {
                new() { Id = Guid.NewGuid(), ProductId = productId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByProductId(productId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByProductId(productId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<
                WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            >(okResult.Value);
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByProductId(productId), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductsController_GetById_ShouldGetVehicleMaintenanceProductById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var dtoMock = new VehicleMaintenanceProductDto { Id = idMock };
            var expectedResult = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto da manutenção encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<VehicleMaintenanceProductDto>>(
                okResult.Value
            );
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }
    }
}
