using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class IndividualsControllerTests
    {
        private readonly IndividualsController _individualController;
        private readonly Mock<IIndividualService> _individualServiceMock;

        public IndividualsControllerTests()
        {
            _individualServiceMock = new Mock<IIndividualService>();
            _individualController = new IndividualsController(_individualServiceMock.Object);
        }

        [Fact]
        public async Task IndividualsController_Add_ShouldAddIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} cadastrado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Add(It.IsAny<ClientDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.Add(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<ClientDto>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_Add_ShouldNotAddIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new ClientDto();

            _individualController.ModelState.AddModelError("Name", "Name is required");

            _individualServiceMock.Setup(_ => _.Add(It.IsAny<ClientDto>()));

            // Act
            var result = await _individualController.Add(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<ClientDto>()), Times.Never);
        }

        [Fact]
        public async Task IndividualsController_Update_ShouldUpdateIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} atualizado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Update(It.IsAny<ClientDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.Update(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<ClientDto>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_Update_ShouldNotUpdateIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new ClientDto();

            _individualController.ModelState.AddModelError("Name", "Name is duplicated");

            _individualServiceMock.Setup(_ => _.Update(It.IsAny<ClientDto>()));

            // Act
            var result = await _individualController.Update(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<ClientDto>()), Times.Never);
        }

        [Fact]
        public async Task IndividualsController_Remove_ShouldRemoveIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} removido com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Remove(It.IsAny<ClientDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.Remove(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Remove(It.IsAny<ClientDto>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_GetAll_ShouldGetAllIndividual_WhenMethodIsCalled()
        {
            // Arrange
            var individualMock = new List<ClientDto>
            {
                new() {
                    Name = "Thiago Thomazelli Ferreira",
                    Email = "thiago.thomazelli@tsi.com.br",
                    SocialSecurityCard = "111.222.333-44",
                    NationalIdCard = "11.222.333-4",
                    Birthday = DateTime.Now
                },
                new() {
                    Name = "Leonardo Thomazelli Ferreira",
                    Email = "leonardo.thomazelli@tsi.com.br",
                    SocialSecurityCard = "444.333.222-11",
                    NationalIdCard = "44.333.222-1",
                    Birthday = DateTime.Now
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"{individualMock.Count()} registro(s) encontrado(s)."
            };

            _individualServiceMock.Setup(_ => _.FindAll())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<ClientDto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_GetById_ShouldGetIndividualById_WhenMethodIsCalled()
        {
            // Arrange
            const int idMock =1;
            var individualMock = new ClientDto
            {
                Id = idMock,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso"
            };

            _individualServiceMock.Setup(_ => _.FindById(It.IsAny<int?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindById(It.IsAny<int?>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_GetByEmail_ShouldGetIndividualByEmail_WhenMethodIsCalled()
        {
            // Arrange
            var emailMock = "thiago.thomazelli@tsi.com.br";
            var individualMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = emailMock,
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.FindByEmail(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.GetByEmail(emailMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindByEmail(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_GetBySocialSecurityCard_ShouldGetIndividualBySocialSecurityCard_WhenMethodIsCalled()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var individualMock = new ClientDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = socialSecurityCardMock,
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.FindBySocialSecurityCard(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.GetBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ClientDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindBySocialSecurityCard(It.IsAny<string>()), Times.Once);
        }
    }
}
