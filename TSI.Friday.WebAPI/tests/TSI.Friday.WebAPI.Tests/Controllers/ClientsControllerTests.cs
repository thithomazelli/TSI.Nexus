using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class ClientsControllerTests
    {
        private readonly ClientsController _clientController;
        private readonly Mock<IClientService> _clientServiceMock;

        public ClientsControllerTests()
        {
            _clientServiceMock = new Mock<IClientService>();
            _clientController = new ClientsController(_clientServiceMock.Object);
        }

        [Fact]
        public async Task ClientsController_Remove_ShouldRemoveClientSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.333/0001-44",
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} removido com sucesso."
            };

            _clientServiceMock.Setup(_ => _.Remove(It.IsAny<ClientDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _clientController.Remove(clientMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(clientMock, response.Data);

            _clientServiceMock.Verify(_ => _.Remove(It.IsAny<ClientDto>()), Times.Once);
        }

        [Fact]
        public async Task ClientsController_GetAll_ShouldGetAllClient_WhenMethodIsCalled()
        {
            // Arrange
            var clientMock = new List<ClientDto>
                {
                    new() {
                        Name = "Thiago Thomazelli Ferreira",
                        Email = "thiago.thomazelli@tsi.com.br",
                        NationalRegistry = "11.222.333/0001-44",
                    },
                    new() {
                        Name = "Leonardo Thomazelli Ferreira",
                        Email = "leonardo.thomazelli@tsi.com.br",
                        NationalRegistry = "44.333.222/0001-11",
                    },
                };

            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"{clientMock.Count()} registro(s) encontrado(s)."
            };

            _clientServiceMock.Setup(_ => _.FindAll())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _clientController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<ClientDto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(clientMock, response.Data);

            _clientServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }
    }
}