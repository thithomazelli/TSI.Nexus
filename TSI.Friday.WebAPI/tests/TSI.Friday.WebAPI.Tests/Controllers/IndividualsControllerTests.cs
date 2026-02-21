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
            var individualMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now,
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartnere {individualMock.Name} cadastrado com sucesso.",
            };

            _individualServiceMock
                .Setup(_ => _.Add(It.IsAny<BusinessPartnerDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.Add(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<BusinessPartnerDto>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_Add_ShouldNotAddIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new BusinessPartnerDto();

            _individualController.ModelState.AddModelError("Name", "Name is required");

            _individualServiceMock.Setup(_ => _.Add(It.IsAny<BusinessPartnerDto>()));

            // Act
            var result = await _individualController.Add(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Add(It.IsAny<BusinessPartnerDto>()), Times.Never);
        }

        [Fact]
        public async Task IndividualsController_Update_ShouldUpdateIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now,
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartnere {individualMock.Name} atualizado com sucesso.",
            };

            _individualServiceMock
                .Setup(_ => _.Update(It.IsAny<BusinessPartnerDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.Update(individualMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<BusinessPartnerDto>()), Times.Once);
        }

        [Fact]
        public async Task IndividualsController_Update_ShouldNotUpdateIndividualSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var individualMock = new BusinessPartnerDto();

            _individualController.ModelState.AddModelError("Name", "Name is duplicated");

            _individualServiceMock.Setup(_ => _.Update(It.IsAny<BusinessPartnerDto>()));

            // Act
            var result = await _individualController.Update(individualMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _individualServiceMock.Verify(_ => _.Update(It.IsAny<BusinessPartnerDto>()), Times.Never);
        }

        [Fact]
        public async Task IndividualsController_GetBySocialSecurityCard_ShouldGetIndividualBySocialSecurityCard_WhenMethodIsCalled()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var individualMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = socialSecurityCardMock,
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now,
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartnere {individualMock.Name} encontrado com sucesso.",
            };

            _individualServiceMock
                .Setup(_ => _.FindBySocialSecurityCard(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _individualController.GetBySocialSecurityCard(
                socialSecurityCardMock
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _individualServiceMock.Verify(
                _ => _.FindBySocialSecurityCard(It.IsAny<string>()),
                Times.Once
            );
        }
    }
}
