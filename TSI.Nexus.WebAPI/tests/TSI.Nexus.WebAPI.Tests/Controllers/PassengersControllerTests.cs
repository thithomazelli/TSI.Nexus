using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class PassengersControllerTests
    {
        private readonly PassengersController _controller;
        private readonly Mock<IPassengerService> _serviceMock;

        public PassengersControllerTests()
        {
            _serviceMock = new Mock<IPassengerService>();
            _controller = new PassengersController(_serviceMock.Object);
        }

        [Fact]
        public async Task PassengersController_Add_ShouldAddPassengerSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var passengerMock = new Passenger
            {
                Id = Guid.NewGuid(),
                TripId = Guid.NewGuid(),
                Name = "Maria Silva",
            };
            var expectedResult = new WebApiResponse<Passenger>
            {
                Data = passengerMock,
                Status = ResponseStatus.Success,
                Message = $"Passageiro {passengerMock.Name} cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<Passenger>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(passengerMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Passenger>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Add(It.IsAny<Passenger>()), Times.Once);
        }

        [Fact]
        public async Task PassengersController_Add_ShouldNotAddPassenger_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var passengerMock = new Passenger();
            _controller.ModelState.AddModelError("TripId", "TripId is required");

            // Act
            var result = await _controller.Add(passengerMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("TripId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<Passenger>()), Times.Never);
        }

        [Fact]
        public async Task PassengersController_AddRange_ShouldImportAllPassengers_WhenMethodIsCalled()
        {
            // Arrange
            var passengersMock = new List<Passenger>
            {
                new() { Id = Guid.NewGuid(), TripId = Guid.NewGuid(), Name = "Passageiro 1" },
                new() { Id = Guid.NewGuid(), TripId = Guid.NewGuid(), Name = "Passageiro 2" },
            };
            var expectedResult = new WebApiResponse<IEnumerable<Passenger>>
            {
                Data = passengersMock,
                Status = ResponseStatus.Success,
                Message = "2 passageiro(s) importado(s) com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.AddRange(It.IsAny<IEnumerable<Passenger>>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.AddRange(passengersMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Passenger>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(passengersMock, response.Data);

            _serviceMock.Verify(_ => _.AddRange(It.IsAny<IEnumerable<Passenger>>()), Times.Once);
        }

        [Fact]
        public async Task PassengersController_Update_ShouldUpdatePassengerSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var passengerMock = new Passenger { Id = Guid.NewGuid(), TripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<Passenger>
            {
                Data = passengerMock,
                Status = ResponseStatus.Success,
                Message = "Passageiro atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<Passenger>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(passengerMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Passenger>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<Passenger>()), Times.Once);
        }

        [Fact]
        public async Task PassengersController_Remove_ShouldRemovePassengerSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var passengerMock = new Passenger { Id = Guid.NewGuid(), TripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<Passenger>
            {
                Data = passengerMock,
                Status = ResponseStatus.Success,
                Message = "Passageiro removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<Passenger>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(passengerMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Passenger>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<Passenger>()), Times.Once);
        }

        [Fact]
        public async Task PassengersController_GetByTrip_ShouldGetPassengersForTrip_WhenMethodIsCalled()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var passengersMock = new List<Passenger>
            {
                new() { Id = Guid.NewGuid(), TripId = tripId, Name = "Maria Silva" },
            };
            var expectedResult = new WebApiResponse<IEnumerable<Passenger>>
            {
                Data = passengersMock,
                Status = ResponseStatus.Success,
                Message = $"{passengersMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByTrip(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTrip(tripId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Passenger>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(passengersMock, response.Data);

            _serviceMock.Verify(_ => _.FindByTrip(It.IsAny<Guid>()), Times.Once);
        }
    }
}
