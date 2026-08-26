using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class EventParticipantsControllerTests
    {
        private readonly EventParticipantsController _controller;
        private readonly Mock<IEventParticipantService> _serviceMock;

        public EventParticipantsControllerTests()
        {
            _serviceMock = new Mock<IEventParticipantService>();
            _controller = new EventParticipantsController(_serviceMock.Object);
        }

        [Fact]
        public async Task EventParticipantsController_Add_ShouldAddEventParticipantSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventParticipantMock = new EventParticipantDto
            {
                Id = Guid.NewGuid(),
                EventId = Guid.NewGuid(),
                Name = "Maria",
            };
            var expectedResult = new WebApiResponse<EventParticipantDto>
            {
                Data = eventParticipantMock,
                Status = ResponseStatus.Success,
                Message = "Participante cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<EventParticipantDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(eventParticipantMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventParticipantDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(eventParticipantMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<EventParticipantDto>()), Times.Once);
        }

        [Fact]
        public async Task EventParticipantsController_Add_ShouldNotAddEventParticipant_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var eventParticipantMock = new EventParticipantDto();
            _controller.ModelState.AddModelError("EventId", "EventId is required");

            // Act
            var result = await _controller.Add(eventParticipantMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("EventId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<EventParticipantDto>()), Times.Never);
        }

        [Fact]
        public async Task EventParticipantsController_Remove_ShouldRemoveEventParticipantSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventParticipantMock = new EventParticipantDto
            {
                Id = Guid.NewGuid(),
                EventId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<EventParticipantDto>
            {
                Data = eventParticipantMock,
                Status = ResponseStatus.Success,
                Message = "Participante removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<EventParticipantDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(eventParticipantMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<EventParticipantDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<EventParticipantDto>()), Times.Once);
        }

        [Fact]
        public async Task EventParticipantsController_GetByEventId_ShouldGetEventParticipantsForEvent_WhenMethodIsCalled()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var eventParticipantsMock = new List<EventParticipantDto>
            {
                new() { Id = Guid.NewGuid(), EventId = eventId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<EventParticipantDto>>
            {
                Data = eventParticipantsMock,
                Status = ResponseStatus.Success,
                Message = $"{eventParticipantsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByEventId(eventId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByEventId(eventId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<EventParticipantDto>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(eventParticipantsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByEventId(eventId), Times.Once);
        }
    }
}
