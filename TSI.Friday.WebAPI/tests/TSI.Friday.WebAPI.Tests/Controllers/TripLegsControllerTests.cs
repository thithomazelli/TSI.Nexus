using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class TripLegsControllerTests
    {
        private readonly TripLegsController _controller;
        private readonly Mock<ITripLegService> _serviceMock;

        public TripLegsControllerTests()
        {
            _serviceMock = new Mock<ITripLegService>();
            _controller = new TripLegsController(_serviceMock.Object);
        }

        [Fact]
        public async Task TripLegsController_Add_ShouldAddTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var tripLegMock = new TripLeg { Id = Guid.NewGuid(), OrderId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripLeg>
            {
                Data = tripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho da viagem cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<TripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(tripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Add(It.IsAny<TripLeg>()), Times.Once);
        }

        [Fact]
        public async Task TripLegsController_Add_ShouldNotAddTripLeg_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var tripLegMock = new TripLeg();
            _controller.ModelState.AddModelError("OrderId", "OrderId is required");

            // Act
            var result = await _controller.Add(tripLegMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("OrderId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<TripLeg>()), Times.Never);
        }

        [Fact]
        public async Task TripLegsController_Update_ShouldUpdateTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var tripLegMock = new TripLeg { Id = Guid.NewGuid(), OrderId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripLeg>
            {
                Data = tripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho da viagem atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<TripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(tripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<TripLeg>()), Times.Once);
        }

        [Fact]
        public async Task TripLegsController_Remove_ShouldRemoveTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var tripLegMock = new TripLeg { Id = Guid.NewGuid(), OrderId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripLeg>
            {
                Data = tripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho da viagem removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<TripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(tripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<TripLeg>()), Times.Once);
        }

        [Fact]
        public async Task TripLegsController_GetById_ShouldGetTripLegById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var tripLegMock = new TripLeg { Id = idMock, OrderId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripLeg>
            {
                Data = tripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho da viagem encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(It.IsAny<Guid?>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(tripLegMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task TripLegsController_GetByOrder_ShouldGetTripLegsForOrder_WhenMethodIsCalled()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var tripLegsMock = new List<TripLeg> { new() { Id = Guid.NewGuid(), OrderId = orderId } };
            var expectedResult = new WebApiResponse<IEnumerable<TripLeg>>
            {
                Data = tripLegsMock,
                Status = ResponseStatus.Success,
                Message = $"{tripLegsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByOrder(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByOrder(orderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TripLeg>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(tripLegsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByOrder(It.IsAny<Guid>()), Times.Once);
        }
    }
}
