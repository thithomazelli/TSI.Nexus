using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
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
        public async Task HomeSummary_ShouldReturnOkWithCards()
        {
            // Arrange
            var cards = new List<DashboardCardDto>
            {
                new DashboardCardDto { Title = "Orders (30d)", Value = "R$150,00" },
                new DashboardCardDto { Title = "Recebidos (%)", Value = "56%" },
            };
            _dashboardServiceMock.Setup(s => s.GetInfoCardsAsync()).ReturnsAsync(cards);

            // Act
            var result = await _controller.HomeSummary();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsAssignableFrom<IEnumerable<DashboardCardDto>>(ok.Value);
            response.Should().BeEquivalentTo(cards);
            _dashboardServiceMock.Verify(s => s.GetInfoCardsAsync(), Times.Once);
        }
    }
}
