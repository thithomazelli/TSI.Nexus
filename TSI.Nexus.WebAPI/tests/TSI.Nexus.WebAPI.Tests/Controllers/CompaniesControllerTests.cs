using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class CompaniesControllerTests
    {
        private readonly CompaniesController _companyController;
        private readonly Mock<ICompanyService> _companyServiceMock;

        public CompaniesControllerTests()
        {
            _companyServiceMock = new Mock<ICompanyService>();
            _companyController = new CompaniesController(_companyServiceMock.Object);
        }

        [Fact]
        public async Task CompaniesController_Add_ShouldAddCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var companyMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.333/0001-44",
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartner {companyMock.Name} cadastrado com sucesso.",
            };

            _companyServiceMock
                .Setup(_ => _.Add(It.IsAny<BusinessPartnerDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _companyController.Add(companyMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(companyMock, response.Data);

            _companyServiceMock.Verify(_ => _.Add(It.IsAny<BusinessPartnerDto>()), Times.Once);
        }

        [Fact]
        public async Task CompaniesController_Add_ShouldNotAddCompanySuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var companyMock = new BusinessPartnerDto();

            _companyController.ModelState.AddModelError("Name", "Name is required");

            _companyServiceMock.Setup(_ => _.Add(It.IsAny<BusinessPartnerDto>()));

            // Act
            var result = await _companyController.Add(companyMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _companyServiceMock.Verify(_ => _.Add(It.IsAny<BusinessPartnerDto>()), Times.Never);
        }

        [Fact]
        public async Task CompaniesController_Update_ShouldUpdateCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var companyMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.333/0001-44",
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartner {companyMock.Name} atualizado com sucesso.",
            };

            _companyServiceMock
                .Setup(_ => _.Update(It.IsAny<BusinessPartnerDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _companyController.Update(companyMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(companyMock, response.Data);

            _companyServiceMock.Verify(_ => _.Update(It.IsAny<BusinessPartnerDto>()), Times.Once);
        }

        [Fact]
        public async Task CompaniesController_Update_ShouldNotUpdateCompanySuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var companyMock = new BusinessPartnerDto();

            _companyController.ModelState.AddModelError("Name", "Name is duplicated");

            _companyServiceMock.Setup(_ => _.Update(It.IsAny<BusinessPartnerDto>()));

            // Act
            var result = await _companyController.Update(companyMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _companyServiceMock.Verify(_ => _.Update(It.IsAny<BusinessPartnerDto>()), Times.Never);
        }

        [Fact]
        public async Task CompaniesController_GetBySocialSecurityCard_ShouldGetCompanyBySocialSecurityCard_WhenMethodIsCalled()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var companyMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.333/0001-44",
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartner {companyMock.Name} encontrado com sucesso.",
            };

            _companyServiceMock
                .Setup(_ => _.FindByNationalRegistry(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _companyController.GetByNationalRegistry(socialSecurityCardMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(companyMock, response.Data);

            _companyServiceMock.Verify(
                _ => _.FindByNationalRegistry(It.IsAny<string>()),
                Times.Once
            );
        }
    }
}
