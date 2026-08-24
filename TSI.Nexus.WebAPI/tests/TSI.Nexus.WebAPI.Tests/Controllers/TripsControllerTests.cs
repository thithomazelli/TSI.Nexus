using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class TripsControllerTests
    {
        private readonly TripsController _controller;
        private readonly Mock<ITripService> _tripServiceMock;
        private readonly IList<TripDto> _tripsMock;

        public TripsControllerTests()
        {
            _tripServiceMock = new Mock<ITripService>();
            _controller = new TripsController(_tripServiceMock.Object);

            _tripsMock = new List<TripDto>
            {
                new TripDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    TripNumber = "SER-V001",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new TripDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    TripNumber = "SER-V002",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
            };
        }

        [Fact]
        public async Task GetAll_ShouldReturnOkWithData_WhenServiceReturnsTrips()
        {
            // Arrange
            var expected = new WebApiResponse<IEnumerable<TripDto>>
            {
                Data = _tripsMock,
                Status = ResponseStatus.Success,
                Message = $"{_tripsMock.Count} registro(s) encontrado(s).",
            };

            _tripServiceMock.Setup(s => s.FindAll()).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TripDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _tripServiceMock.Verify(s => s.FindAll(), Times.Once);
        }

        [Fact]
        public async Task GetById_ShouldReturnOkWithTrip_WhenServiceReturnsTrip()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var trip = _tripsMock.First(t => t.Id == id);
            var expected = new WebApiResponse<TripDto>
            {
                Data = trip,
                Status = ResponseStatus.Success,
                Message = $"Viagem {trip.TripNumber} encontrada com sucesso",
            };

            _tripServiceMock.Setup(s => s.FindById(id)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _tripServiceMock.Verify(s => s.FindById(id), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnOkWithCreatedTrip_WhenModelIsValid()
        {
            // Arrange
            var trip = new TripDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                TripNumber = "SER-V003",
                BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            };
            var expected = new WebApiResponse<TripDto>
            {
                Data = trip,
                Status = ResponseStatus.Success,
                Message = $"Viagem {trip.TripNumber} cadastrada com sucesso.",
            };

            _tripServiceMock.Setup(s => s.Add(trip)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(trip);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TripDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _tripServiceMock.Verify(s => s.Add(trip), Times.Once);
        }

        [Fact]
        public async Task GetByBusinessPartnerId_ShouldReturnOkWithData_WhenServiceReturnsTrips()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var expected = new WebApiResponse<IEnumerable<TripDto>>
            {
                Data = _tripsMock,
                Status = ResponseStatus.Success,
                Message = $"{_tripsMock.Count} registro(s) encontrado(s).",
            };

            _tripServiceMock
                .Setup(s => s.FindByBusinessPartnerId(businessPartnerId))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByBusinessPartnerId(businessPartnerId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TripDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _tripServiceMock.Verify(s => s.FindByBusinessPartnerId(businessPartnerId), Times.Once);
        }
    }
}
