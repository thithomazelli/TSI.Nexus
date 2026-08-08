using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class CommissionsControllerTests
    {
        private readonly CommissionsController _controller;
        private readonly Mock<ICommissionService> _serviceMock;

        public CommissionsControllerTests()
        {
            _serviceMock = new Mock<ICommissionService>();
            _controller = new CommissionsController(_serviceMock.Object);
        }

        [Fact]
        public async Task CommissionsController_Update_ShouldUpdateCommissionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var commissionMock = new Commission
            {
                Id = Guid.NewGuid(),
                DriverId = Guid.NewGuid(),
                ServiceOrderId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<Commission>
            {
                Data = commissionMock,
                Status = ResponseStatus.Success,
                Message = "Comissão atualizada com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<Commission>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(commissionMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Commission>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<Commission>()), Times.Once);
        }

        [Fact]
        public async Task CommissionsController_Update_ShouldNotUpdateCommission_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var commissionMock = new Commission();
            _controller.ModelState.AddModelError("DriverId", "DriverId is required");

            // Act
            var result = await _controller.Update(commissionMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("DriverId"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<Commission>()), Times.Never);
        }

        [Fact]
        public async Task CommissionsController_GetByDriver_ShouldGetCommissionsForDriver_WhenMethodIsCalled()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var commissionsMock = new List<Commission>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    DriverId = driverId,
                    ServiceOrderId = Guid.NewGuid(),
                },
            };
            var expectedResult = new WebApiResponse<IEnumerable<Commission>>
            {
                Data = commissionsMock,
                Status = ResponseStatus.Success,
                Message = $"{commissionsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByDriver(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByDriver(driverId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Commission>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(commissionsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByDriver(It.IsAny<Guid>()), Times.Once);
        }

        [Fact]
        public async Task CommissionsController_GetById_ShouldGetCommissionById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var commissionMock = new Commission
            {
                Id = idMock,
                DriverId = Guid.NewGuid(),
                ServiceOrderId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<Commission>
            {
                Data = commissionMock,
                Status = ResponseStatus.Success,
                Message = "Comissão encontrada com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(It.IsAny<Guid?>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Commission>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(commissionMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }
    }
}
