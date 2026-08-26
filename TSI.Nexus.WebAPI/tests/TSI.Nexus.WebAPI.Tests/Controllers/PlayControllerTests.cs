using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class PlayControllerTests
    {
        private readonly PlayController _controller;

        public PlayControllerTests()
        {
            _controller = new PlayController();
        }

        [Fact]
        public async Task PlayController_Players_ShouldReturnOkWithMessage_WhenMethodIsCalled()
        {
            // Act
            var result = await _controller.Players();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var jsonResult = Assert.IsType<JsonResult>(okResult.Value);
            Assert.NotNull(jsonResult.Value);
        }
    }
}
