using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class OverdueControllerTests
    {
        private readonly OverdueController _controller;
        private readonly Mock<IOverdueService> _serviceMock;

        public OverdueControllerTests()
        {
            _serviceMock = new Mock<IOverdueService>();
            _controller = new OverdueController(_serviceMock.Object);
        }

        [Fact]
        public async Task OverdueController_Run_ShouldReturnOkWithOverdueResult_WhenMethodIsCalled()
        {
            // Arrange
            var expectedResult = new OverdueResult { PaymentsUpdated = 3 };

            _serviceMock.Setup(_ => _.RunOverdueUpdateAsync()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Run();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<OverdueResult>(okResult.Value);
            Assert.Equal(3, response.PaymentsUpdated);

            _serviceMock.Verify(_ => _.RunOverdueUpdateAsync(), Times.Once);
        }
    }
}
