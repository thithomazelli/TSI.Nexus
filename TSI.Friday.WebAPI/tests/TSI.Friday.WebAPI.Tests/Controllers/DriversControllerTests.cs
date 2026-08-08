using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class DriversControllerTests
    {
        private readonly DriversController _driversController;
        private readonly Mock<IDriverService> _driverServiceMock;

        public DriversControllerTests()
        {
            _driverServiceMock = new Mock<IDriverService>();
            _driversController = new DriversController(_driverServiceMock.Object);
        }

        [Fact]
        public async Task DriversController_Add_ShouldAddDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
                SocialSecurityCard = "11111111111",
            };

            var expectedResult = new WebApiResponse<Driver>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"Motorista {driverMock.Name} cadastrado com sucesso.",
            };

            _driverServiceMock.Setup(_ => _.Add(It.IsAny<Driver>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.Add(driverMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Driver>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(driverMock, response.Data);

            _driverServiceMock.Verify(_ => _.Add(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriversController_Add_ShouldNotAddDriverSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var driverMock = new Driver();

            _driversController.ModelState.AddModelError("Name", "Name is required");

            // Act
            var result = await _driversController.Add(driverMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _driverServiceMock.Verify(_ => _.Add(It.IsAny<Driver>()), Times.Never);
        }

        [Fact]
        public async Task DriversController_Update_ShouldUpdateDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
            };

            var expectedResult = new WebApiResponse<Driver>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"Motorista {driverMock.Name} atualizado com sucesso.",
            };

            _driverServiceMock.Setup(_ => _.Update(It.IsAny<Driver>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.Update(driverMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Driver>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _driverServiceMock.Verify(_ => _.Update(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriversController_Remove_ShouldRemoveDriverSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
            };

            var expectedResult = new WebApiResponse<Driver>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"Motorista {driverMock.Name} removido com sucesso.",
            };

            _driverServiceMock.Setup(_ => _.Remove(It.IsAny<Driver>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.Remove(driverMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Driver>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _driverServiceMock.Verify(_ => _.Remove(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriversController_GetAll_ShouldGetAllDrivers_WhenMethodIsCalled()
        {
            // Arrange
            var driverMock = new List<Driver>
            {
                new() { Id = Guid.NewGuid(), Name = "João da Silva" },
                new() { Id = Guid.NewGuid(), Name = "Maria Souza" },
            };

            var expectedResult = new WebApiResponse<IEnumerable<Driver>>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"{driverMock.Count} registro(s) encontrado(s).",
            };

            _driverServiceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Driver>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(driverMock, response.Data);

            _driverServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task DriversController_GetById_ShouldGetDriverById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverMock = new Driver { Id = idMock, Name = "João da Silva" };

            var expectedResult = new WebApiResponse<Driver>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"Motorista {driverMock.Name} encontrado com sucesso",
            };

            _driverServiceMock
                .Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Driver>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(driverMock, response.Data);

            _driverServiceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task DriversController_GetBySocialSecurityCard_ShouldGetDriverByCpf_WhenMethodIsCalled()
        {
            // Arrange
            var cpfMock = "11111111111";
            var driverMock = new Driver { Id = Guid.NewGuid(), SocialSecurityCard = cpfMock };

            var expectedResult = new WebApiResponse<Driver>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = "Motorista encontrado com sucesso",
            };

            _driverServiceMock
                .Setup(_ => _.FindBySocialSecurityCard(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.GetBySocialSecurityCard(cpfMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Driver>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(driverMock, response.Data);

            _driverServiceMock.Verify(
                _ => _.FindBySocialSecurityCard(It.IsAny<string>()),
                Times.Once
            );
        }

        [Fact]
        public async Task DriversController_GetActive_ShouldGetOnlyActiveDrivers_WhenMethodIsCalled()
        {
            // Arrange
            var driverMock = new List<Driver>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "João da Silva",
                    Status = DriverStatus.Active,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<Driver>>
            {
                Data = driverMock,
                Status = ResponseStatus.Success,
                Message = $"{driverMock.Count} registro(s) encontrado(s).",
            };

            _driverServiceMock.Setup(_ => _.FindActive()).ReturnsAsync(expectedResult);

            // Act
            var result = await _driversController.GetActive();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Driver>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(driverMock, response.Data);

            _driverServiceMock.Verify(_ => _.FindActive(), Times.Once);
        }
    }
}
