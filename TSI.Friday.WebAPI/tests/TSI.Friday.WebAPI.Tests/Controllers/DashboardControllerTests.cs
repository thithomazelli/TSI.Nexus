using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class DashboardControllerTests
    {
        private readonly Mock<IDashboardService> _dashboardServiceMock;
        private readonly DashboardController _controller;

        public DashboardControllerTests()
        {
            _dashboardServiceMock = new Mock<IDashboardService>();
            _controller = new DashboardController(_dashboardServiceMock.Object);
        }

        [Fact]
        public async Task GetInfoCards_ShouldReturnOkWithCards()
        {
            // Arrange
            var cards = new List<DashboardCardDto>
            {
                new DashboardCardDto { Title = "Novos Pedidos", Value = "R$150,00" },
                new DashboardCardDto { Title = "Recebidos (%)", Value = "56%" },
            };

            var expected = new WebApiResponse<IEnumerable<DashboardCardDto>>
            {
                Data = cards,
                Status = ResponseStatus.Success,
                Message = "2 info card(s) gerados.",
            };

            _dashboardServiceMock
                .Setup(s => s.GetInfoCardsAsync(It.IsAny<int>()))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.GetInfoCards(0);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<DashboardCardDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _dashboardServiceMock.Verify(s => s.GetInfoCardsAsync(It.IsAny<int>()), Times.Once);
        }
    }
}
