using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class EventsControllerTests
    {
        private readonly EventsController _controller;
        private readonly Mock<IEventService> _serviceMock;

        public EventsControllerTests()
        {
            _serviceMock = new Mock<IEventService>();
            _controller = new EventsController(_serviceMock.Object);
        }

        private static EventDto BuildEvent(Guid? id = null) =>
            new()
            {
                Id = id ?? Guid.NewGuid(),
                Title = "Reunião",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(1),
            };

        [Fact]
        public async Task EventsController_Add_ShouldAddEventSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventMock = BuildEvent();
            var expectedResult = new WebApiResponse<EventDto>
            {
                Data = eventMock,
                Status = ResponseStatus.Success,
                Message = "Evento cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<EventDto>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(eventMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(eventMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<EventDto>()), Times.Once);
        }

        [Fact]
        public async Task EventsController_Add_ShouldNotAddEvent_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var eventMock = new EventDto();
            _controller.ModelState.AddModelError("Title", "Title is required");

            // Act
            var result = await _controller.Add(eventMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Title"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<EventDto>()), Times.Never);
        }

        [Fact]
        public async Task EventsController_Update_ShouldUpdateEventSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventMock = BuildEvent();
            var expectedResult = new WebApiResponse<EventDto>
            {
                Data = eventMock,
                Status = ResponseStatus.Success,
                Message = "Evento atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<EventDto>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(eventMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<EventDto>()), Times.Once);
        }

        [Fact]
        public async Task EventsController_Update_ShouldNotUpdateEvent_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var eventMock = new EventDto();
            _controller.ModelState.AddModelError("Title", "Title is required");

            // Act
            var result = await _controller.Update(eventMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Title"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<EventDto>()), Times.Never);
        }

        [Fact]
        public async Task EventsController_Remove_ShouldRemoveEventSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventMock = BuildEvent();
            var expectedResult = new WebApiResponse<EventDto>
            {
                Data = eventMock,
                Status = ResponseStatus.Success,
                Message = "Evento removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<EventDto>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(eventMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<EventDto>()), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetAll_ShouldGetAllEvents_WhenMethodIsCalled()
        {
            // Arrange
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetById_ShouldGetEventById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var eventMock = BuildEvent(idMock);
            var expectedResult = new WebApiResponse<EventDto>
            {
                Data = eventMock,
                Status = ResponseStatus.Success,
                Message = "Evento encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(eventMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByUserId_ShouldGetEventsForUser_WhenMethodIsCalled()
        {
            // Arrange
            const string userId = "1";
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByUserId(userId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByUserId(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByUserId(userId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByBusinessPartnerId_ShouldGetEventsForBusinessPartner_WhenMethodIsCalled()
        {
            // Arrange
            var businessPartnerId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByBusinessPartnerId(businessPartnerId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByBusinessPartnerId(businessPartnerId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByBusinessPartnerId(businessPartnerId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByQuoteId_ShouldGetEventsForQuote_WhenMethodIsCalled()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByQuoteId(quoteId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByQuoteId(quoteId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByQuoteId(quoteId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByOrderId_ShouldGetEventsForOrder_WhenMethodIsCalled()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByOrderId(orderId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByOrderId(orderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByOrderId(orderId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByPurchaseOrderId_ShouldGetEventsForPurchaseOrder_WhenMethodIsCalled()
        {
            // Arrange
            var purchaseOrderId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByPurchaseOrderId(purchaseOrderId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByPurchaseOrderId(purchaseOrderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByPurchaseOrderId(purchaseOrderId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByTripId_ShouldGetEventsForTrip_WhenMethodIsCalled()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByTripId(tripId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTripId(tripId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByTripId(tripId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByTransactionId_ShouldGetEventsForTransaction_WhenMethodIsCalled()
        {
            // Arrange
            var transactionId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByTransactionId(transactionId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTransactionId(transactionId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByTransactionId(transactionId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByPaymentId_ShouldGetEventsForPayment_WhenMethodIsCalled()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByPaymentId(paymentId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByPaymentId(paymentId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByPaymentId(paymentId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByVehicleId_ShouldGetEventsForVehicle_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByVehicleId(vehicleId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicleId(vehicleId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByVehicleId(vehicleId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByDriverId_ShouldGetEventsForDriver_WhenMethodIsCalled()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByDriverId(driverId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByDriverId(driverId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByDriverId(driverId), Times.Once);
        }

        [Fact]
        public async Task EventsController_GetByVehicleMaintenanceId_ShouldGetEventsForVehicleMaintenance_WhenMethodIsCalled()
        {
            // Arrange
            var vehicleMaintenanceId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByVehicleMaintenanceId(vehicleMaintenanceId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicleMaintenanceId(vehicleMaintenanceId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(
                _ => _.FindByVehicleMaintenanceId(vehicleMaintenanceId),
                Times.Once
            );
        }

        [Fact]
        public async Task EventsController_GetByFuelLogId_ShouldGetEventsForFuelLog_WhenMethodIsCalled()
        {
            // Arrange
            var fuelLogId = Guid.NewGuid();
            var eventsMock = new List<EventDto> { BuildEvent() };
            var expectedResult = new WebApiResponse<IEnumerable<EventDto>>
            {
                Data = eventsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByFuelLogId(fuelLogId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByFuelLogId(fuelLogId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventDto>>>(okResult.Value);
            Assert.Equal(eventsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByFuelLogId(fuelLogId), Times.Once);
        }
    }
}
