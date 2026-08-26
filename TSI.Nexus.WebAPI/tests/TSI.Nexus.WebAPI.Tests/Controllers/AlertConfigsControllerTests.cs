using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class AlertConfigsControllerTests
    {
        private readonly AlertConfigsController _controller;
        private readonly Mock<IAlertConfigService> _serviceMock;

        public AlertConfigsControllerTests()
        {
            _serviceMock = new Mock<IAlertConfigService>();
            _controller = new AlertConfigsController(_serviceMock.Object);
        }

        [Fact]
        public async Task AlertConfigsController_GetAll_ShouldGetAllAlertConfigs_WhenMethodIsCalled()
        {
            // Arrange
            var alertConfigsMock = new List<AlertConfig>
            {
                new() { Key = "DriverLicenseExpiry", Enabled = true },
            };
            var expectedResult = new WebApiResponse<IEnumerable<AlertConfig>>
            {
                Data = alertConfigsMock,
                Status = ResponseStatus.Success,
                Message = $"{alertConfigsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<AlertConfig>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(alertConfigsMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task AlertConfigsController_SetEnabled_ShouldReturnOkWithUpdatedAlertConfig_WhenMethodIsCalled()
        {
            // Arrange
            var alertConfigMock = new AlertConfig { Key = "DriverLicenseExpiry", Enabled = false };
            var expectedResult = new WebApiResponse<AlertConfig>
            {
                Data = alertConfigMock,
                Status = ResponseStatus.Success,
                Message = "Alerta atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.SetEnabled("DriverLicenseExpiry", false))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.SetEnabled("DriverLicenseExpiry", false);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AlertConfig>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(alertConfigMock, response.Data);

            _serviceMock.Verify(_ => _.SetEnabled("DriverLicenseExpiry", false), Times.Once);
        }

        [Fact]
        public async Task AlertConfigsController_SetThresholdDays_ShouldReturnOkWithUpdatedAlertConfig_WhenMethodIsCalled()
        {
            // Arrange
            var alertConfigMock = new AlertConfig
            {
                Key = "DriverLicenseExpiry",
                ThresholdDays = 45,
            };
            var expectedResult = new WebApiResponse<AlertConfig>
            {
                Data = alertConfigMock,
                Status = ResponseStatus.Success,
                Message = "Alerta atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.SetThresholdDays("DriverLicenseExpiry", 45))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.SetThresholdDays("DriverLicenseExpiry", 45);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AlertConfig>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(alertConfigMock, response.Data);

            _serviceMock.Verify(_ => _.SetThresholdDays("DriverLicenseExpiry", 45), Times.Once);
        }
    }
}
