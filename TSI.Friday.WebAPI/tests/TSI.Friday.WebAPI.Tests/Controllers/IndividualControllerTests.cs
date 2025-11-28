using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class IndividualControllerTests
    {
        private readonly IndividualController _individualController;
        private readonly Mock<IIndividualService> _individualServiceMock;

        public IndividualControllerTests()
        {
            _individualServiceMock = new Mock<IIndividualService>();
            _individualController = new IndividualController(_individualServiceMock.Object);
        }

        [Fact]
        public void IndividualController_Add_ShouldAddIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new Individual
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} cadastrado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Add(It.IsAny<Individual>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.Add(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Individual>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualController_Add_ShouldNotAddIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new Individual();

            _individualController.ModelState.AddModelError("Name", "Name is required");

            _individualServiceMock.Setup(_ => _.Add(It.IsAny<Individual>()));

            // Act
            var result = _individualController.Add(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Never);
        }

        [Fact]
        public void IndividualController_Update_ShouldUpdateIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new Individual
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} atualizado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Update(It.IsAny<Individual>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.Update(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Individual>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualController_Update_ShouldNotUpdateIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new Individual();

            _individualController.ModelState.AddModelError("Name", "Name is duplicated");

            _individualServiceMock.Setup(_ => _.Update(It.IsAny<Individual>()));

            // Act
            var result = _individualController.Update(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Never);
        }

        [Fact]
        public void IndividualController_Remove_ShouldRemoveIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new Individual
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} removido com sucesso."
            };

            _individualServiceMock.Setup(_ => _.Remove(It.IsAny<Individual>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.Remove(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Individual>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Remove(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualController_GetAll_ShouldGetAllIndividual_WhenMethodIsCalled()
        {
            // Arrange
            var individualMock = new List<Individual>
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

            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"{individualMock.Count()} registro(s) encontrado(s)."
            };

            _individualServiceMock.Setup(_ => _.FindAll())
                .Returns(expectedResult);

            // Act
            var result = _individualController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Individual>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public void IndividualController_GetById_ShouldGetIndividualById_WhenMethodIsCalled()
        {
            // Arrange
            const int idMock = 1;
            var individualMock = new Individual
            {
                Id = idMock,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso"
            };

            _individualServiceMock.Setup(_ => _.FindById(It.IsAny<int?>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Individual>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindById(It.IsAny<int?>()), Times.Once);
        }

        [Fact]
        public void IndividualController_GetByEmail_ShouldGetIndividualByEmail_WhenMethodIsCalled()
        {
            // Arrange
            var emailMock = "thiago.thomazelli@tsi.com.br";
            var individualMock = new List<Individual>
            {
                new()
                {
                    Name = "Thiago Thomazelli Ferreira",
                    Email = emailMock,
                    SocialSecurityCard = "111.222.333-44",
                    NationalIdCard = "11.222.333-4",
                    Birthday = DateTime.Now
                }
            };

            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"{individualMock.Count()} registro(s) encontrado(s)."
            };

            _individualServiceMock.Setup(_ => _.FindByEmail(It.IsAny<string>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.GetByEmail(emailMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Individual>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindByEmail(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public void IndividualController_GetBySocialSecurityCard_ShouldGetIndividualBySocialSecurityCard_WhenMethodIsCalled()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var individualMock = new Individual
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = socialSecurityCardMock,
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso."
            };

            _individualServiceMock.Setup(_ => _.FindBySocialSecurityCard(It.IsAny<string>()))
                .Returns(expectedResult);

            // Act
            var result = _individualController.GetBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Individual>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.FindBySocialSecurityCard(It.IsAny<string>()), Times.Once);
        }
    }
}
