using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class VehicleMaintenanceOverdueControllerTests
    {
        private readonly VehicleMaintenanceOverdueController _controller;
        private readonly Mock<IVehicleMaintenanceOverdueService> _serviceMock;

        public VehicleMaintenanceOverdueControllerTests()
        {
            _serviceMock = new Mock<IVehicleMaintenanceOverdueService>();
            _controller = new VehicleMaintenanceOverdueController(_serviceMock.Object);
        }

        [Fact]
        public async Task VehicleMaintenanceOverdueController_Run_ShouldReturnOkWithResult_WhenMethodIsCalled()
        {
            // Arrange
            var expectedResult = new VehicleMaintenanceOverdueResult
            {
                MaintenancesUpdated = 2,
                VehiclesBlocked = 2,
            };

            _serviceMock.Setup(_ => _.RunOverdueUpdateAsync()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Run();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<VehicleMaintenanceOverdueResult>(okResult.Value);
            Assert.Equal(2, response.MaintenancesUpdated);
            Assert.Equal(2, response.VehiclesBlocked);

            _serviceMock.Verify(_ => _.RunOverdueUpdateAsync(), Times.Once);
        }
    }
}
