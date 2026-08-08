using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class ServiceOrdersControllerTests
    {
        private readonly ServiceOrdersController _controller;
        private readonly Mock<IServiceOrderService> _serviceMock;

        public ServiceOrdersControllerTests()
        {
            _serviceMock = new Mock<IServiceOrderService>();
            _controller = new ServiceOrdersController(_serviceMock.Object);
        }

        [Fact]
        public async Task ServiceOrdersController_Add_ShouldAddServiceOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var serviceOrderMock = new ServiceOrder
            {
                Id = Guid.NewGuid(),
                Number = "OS-00001",
                OrderId = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<ServiceOrder>
            {
                Data = serviceOrderMock,
                Status = ResponseStatus.Success,
                Message = $"Ordem de Serviço {serviceOrderMock.Number} cadastrada com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<ServiceOrder>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(serviceOrderMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ServiceOrder>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Add(It.IsAny<ServiceOrder>()), Times.Once);
        }

        [Fact]
        public async Task ServiceOrdersController_Add_ShouldNotAddServiceOrder_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var serviceOrderMock = new ServiceOrder();
            _controller.ModelState.AddModelError("DriverId", "DriverId is required");

            // Act
            var result = await _controller.Add(serviceOrderMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("DriverId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<ServiceOrder>()), Times.Never);
        }

        [Fact]
        public async Task ServiceOrdersController_Update_ShouldUpdateServiceOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var serviceOrderMock = new ServiceOrder
            {
                Id = Guid.NewGuid(),
                Number = "OS-00001",
                OrderId = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<ServiceOrder>
            {
                Data = serviceOrderMock,
                Status = ResponseStatus.Success,
                Message = "Ordem de Serviço atualizada com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<ServiceOrder>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(serviceOrderMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ServiceOrder>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<ServiceOrder>()), Times.Once);
        }

        [Fact]
        public async Task ServiceOrdersController_Remove_ShouldRemoveServiceOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var serviceOrderMock = new ServiceOrder
            {
                Id = Guid.NewGuid(),
                Number = "OS-00001",
                OrderId = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<ServiceOrder>
            {
                Data = serviceOrderMock,
                Status = ResponseStatus.Success,
                Message = "Ordem de Serviço removida com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<ServiceOrder>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(serviceOrderMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ServiceOrder>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<ServiceOrder>()), Times.Once);
        }

        [Fact]
        public async Task ServiceOrdersController_GetByDriver_ShouldGetServiceOrdersForDriver_WhenMethodIsCalled()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var serviceOrdersMock = new List<ServiceOrder>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Number = "OS-00001",
                    OrderId = Guid.NewGuid(),
                    DriverId = driverId,
                },
            };
            var expectedResult = new WebApiResponse<IEnumerable<ServiceOrder>>
            {
                Data = serviceOrdersMock,
                Status = ResponseStatus.Success,
                Message = $"{serviceOrdersMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByDriver(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByDriver(driverId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<ServiceOrder>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(serviceOrdersMock, response.Data);

            _serviceMock.Verify(_ => _.FindByDriver(It.IsAny<Guid>()), Times.Once);
        }
    }
}
