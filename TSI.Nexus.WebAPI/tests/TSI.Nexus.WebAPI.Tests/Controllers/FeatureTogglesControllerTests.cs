using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class FeatureTogglesControllerTests
    {
        private readonly FeatureTogglesController _controller;
        private readonly Mock<IFeatureToggleService> _serviceMock;

        public FeatureTogglesControllerTests()
        {
            _serviceMock = new Mock<IFeatureToggleService>();
            _controller = new FeatureTogglesController(_serviceMock.Object);
        }

        [Fact]
        public async Task FeatureTogglesController_GetAll_ShouldGetAllFeatureToggles_WhenMethodIsCalled()
        {
            // Arrange
            var featureTogglesMock = new List<FeatureToggle>
            {
                new() { Key = "FleetModule", Enabled = true },
            };
            var expectedResult = new WebApiResponse<IEnumerable<FeatureToggle>>
            {
                Data = featureTogglesMock,
                Status = ResponseStatus.Success,
                Message = $"{featureTogglesMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<FeatureToggle>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(featureTogglesMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task FeatureTogglesController_GetByKey_ShouldGetFeatureToggleByKey_WhenMethodIsCalled()
        {
            // Arrange
            var featureToggleMock = new FeatureToggle { Key = "FleetModule", Enabled = true };
            var expectedResult = new WebApiResponse<FeatureToggle>
            {
                Data = featureToggleMock,
                Status = ResponseStatus.Success,
                Message = "Módulo encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindByKey("FleetModule")).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByKey("FleetModule");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<FeatureToggle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(featureToggleMock, response.Data);

            _serviceMock.Verify(_ => _.FindByKey("FleetModule"), Times.Once);
        }

        [Fact]
        public async Task FeatureTogglesController_SetEnabled_ShouldReturnOkWithUpdatedFeatureToggle_WhenMethodIsCalled()
        {
            // Arrange
            var featureToggleMock = new FeatureToggle { Key = "FleetModule", Enabled = false };
            var expectedResult = new WebApiResponse<FeatureToggle>
            {
                Data = featureToggleMock,
                Status = ResponseStatus.Success,
                Message = "Módulo atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.SetEnabled("FleetModule", false))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.SetEnabled("FleetModule", false);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<FeatureToggle>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(featureToggleMock, response.Data);

            _serviceMock.Verify(_ => _.SetEnabled("FleetModule", false), Times.Once);
        }
    }
}
