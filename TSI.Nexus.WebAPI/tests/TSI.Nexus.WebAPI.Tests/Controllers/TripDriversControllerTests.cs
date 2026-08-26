using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class TripDriversControllerTests
    {
        private readonly TripDriversController _controller;
        private readonly Mock<ITripDriverService> _serviceMock;

        public TripDriversControllerTests()
        {
            _serviceMock = new Mock<ITripDriverService>();
            _controller = new TripDriversController(_serviceMock.Object);
        }

        [Fact]
        public async Task TripDriversController_Add_ShouldAddTripDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new TripDriverDto { Id = Guid.NewGuid(), TripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripDriverDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Motorista da viagem cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<TripDriverDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDriverDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<TripDriverDto>()), Times.Once);
        }

        [Fact]
        public async Task TripDriversController_Add_ShouldNotAddTripDriver_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new TripDriverDto();
            _controller.ModelState.AddModelError("TripId", "TripId is required");

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("TripId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<TripDriverDto>()), Times.Never);
        }

        [Fact]
        public async Task TripDriversController_Update_ShouldUpdateTripDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new TripDriverDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripDriverDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Motorista da viagem atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<TripDriverDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDriverDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<TripDriverDto>()), Times.Once);
        }

        [Fact]
        public async Task TripDriversController_Update_ShouldNotUpdateTripDriver_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new TripDriverDto();
            _controller.ModelState.AddModelError("TripId", "TripId is required");

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("TripId"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<TripDriverDto>()), Times.Never);
        }

        [Fact]
        public async Task TripDriversController_Remove_ShouldRemoveTripDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new TripDriverDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<TripDriverDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Motorista da viagem removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<TripDriverDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDriverDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<TripDriverDto>()), Times.Once);
        }

        [Fact]
        public async Task TripDriversController_GetByTripId_ShouldGetTripDriversForTrip_WhenMethodIsCalled()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var listMock = new List<TripDriverDto>
            {
                new() { Id = Guid.NewGuid(), TripId = tripId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<TripDriverDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByTripId(tripId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTripId(tripId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TripDriverDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByTripId(tripId), Times.Once);
        }

        [Fact]
        public async Task TripDriversController_GetByDriverId_ShouldGetTripDriversForDriver_WhenMethodIsCalled()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var listMock = new List<TripDriverDto>
            {
                new() { Id = Guid.NewGuid(), DriverId = driverId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<TripDriverDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByDriverId(driverId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByDriverId(driverId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TripDriverDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByDriverId(driverId), Times.Once);
        }

        [Fact]
        public async Task TripDriversController_GetById_ShouldGetTripDriverById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var dtoMock = new TripDriverDto { Id = idMock };
            var expectedResult = new WebApiResponse<TripDriverDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Motorista da viagem encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDriverDto>>(okResult.Value);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }
    }
}
