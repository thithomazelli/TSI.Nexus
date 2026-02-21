using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class BusinessPartnersControllerTests
    {
        private readonly BusinessPartnersController _businessPartnerController;
        private readonly Mock<IBusinessPartnerService> _businessPartnerServiceMock;

        public BusinessPartnersControllerTests()
        {
            _businessPartnerServiceMock = new Mock<IBusinessPartnerService>();
            _businessPartnerController = new BusinessPartnersController(
                _businessPartnerServiceMock.Object
            );
        }

        [Fact]
        public async Task BusinessPartnersController_Remove_ShouldRemoveBusinessPartnerSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var businessPartnerMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.333/0001-44",
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = businessPartnerMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartner {businessPartnerMock.Name} removido com sucesso.",
            };

            _businessPartnerServiceMock
                .Setup(_ => _.Remove(It.IsAny<BusinessPartnerDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _businessPartnerController.Remove(businessPartnerMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(businessPartnerMock, response.Data);

            _businessPartnerServiceMock.Verify(
                _ => _.Remove(It.IsAny<BusinessPartnerDto>()),
                Times.Once
            );
        }

        [Fact]
        public async Task BusinessPartnersController_GetAllClients_ShouldGetAllClients_WhenMethodIsCalled()
        {
            // Arrange
            var businessPartnerMock = new List<BusinessPartnerDto>
            {
                new()
                {
                    Name = "Thiago Thomazelli Ferreira",
                    Email = "thiago.thomazelli@tsi.com.br",
                    NationalRegistry = "11.222.333/0001-44",
                    Type = BusinessPartnerType.Client,
                },
                new()
                {
                    Name = "Leonardo Thomazelli Ferreira",
                    Email = "leonardo.thomazelli@tsi.com.br",
                    NationalRegistry = "44.333.222/0001-11",
                    Type = BusinessPartnerType.Client,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<BusinessPartnerDto>>
            {
                Data = businessPartnerMock,
                Status = ResponseStatus.Success,
                Message = $"{businessPartnerMock.Count()} registro(s) encontrado(s).",
            };

            _businessPartnerServiceMock
                .Setup(_ => _.FindAllByType(BusinessPartnerType.Client))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _businessPartnerController.GetAllClients();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<BusinessPartnerDto>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(businessPartnerMock, response.Data);

            _businessPartnerServiceMock.Verify(
                _ => _.FindAllByType(BusinessPartnerType.Client),
                Times.Once
            );
        }

        [Fact]
        public async Task BusinessPartnersController_GetAllSuppliers_ShouldGetAllSuppliers_WhenMethodIsCalled()
        {
            // Arrange
            var businessPartnerMock = new List<BusinessPartnerDto>
            {
                new()
                {
                    Name = "Thiago Thomazelli Ferreira",
                    Email = "thiago.thomazelli@tsi.com.br",
                    NationalRegistry = "11.222.333/0001-44",
                    Type = BusinessPartnerType.Supplier,
                },
                new()
                {
                    Name = "Leonardo Thomazelli Ferreira",
                    Email = "leonardo.thomazelli@tsi.com.br",
                    NationalRegistry = "44.333.222/0001-11",
                    Type = BusinessPartnerType.Supplier,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<BusinessPartnerDto>>
            {
                Data = businessPartnerMock,
                Status = ResponseStatus.Success,
                Message = $"{businessPartnerMock.Count()} registro(s) encontrado(s).",
            };

            _businessPartnerServiceMock
                .Setup(_ => _.FindAllByType(BusinessPartnerType.Supplier))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _businessPartnerController.GetAllSuppliers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<BusinessPartnerDto>>>(
                okResult.Value
            );
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(businessPartnerMock, response.Data);

            _businessPartnerServiceMock.Verify(
                _ => _.FindAllByType(BusinessPartnerType.Supplier),
                Times.Once
            );
        }

        [Fact]
        public async Task BusinessPartnersController_GetById_ShouldGetBusinessPartnerById_WhenMethodIsCalled()
        {
            // Arrange
            const int idMock = 1;
            var individualMock = new BusinessPartnerDto
            {
                Id = idMock,
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
                Message = $"BusinessPartner {individualMock.Name} encontrado com sucesso",
            };

            _businessPartnerServiceMock
                .Setup(_ => _.FindById(It.IsAny<int?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _businessPartnerController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _businessPartnerServiceMock.Verify(_ => _.FindById(It.IsAny<int?>()), Times.Once);
        }

        [Fact]
        public async Task BusinessPartnersController_GetByEmail_ShouldGetBusinessPartnerByEmail_WhenMethodIsCalled()
        {
            // Arrange
            var emailMock = "thiago.thomazelli@tsi.com.br";
            var individualMock = new BusinessPartnerDto
            {
                Name = "Thiago Thomazelli Ferreira",
                Email = emailMock,
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4",
                Birthday = DateTime.Now,
            };

            var expectedResult = new WebApiResponse<BusinessPartnerDto>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"BusinessPartner {individualMock.Name} encontrado com sucesso.",
            };

            _businessPartnerServiceMock
                .Setup(_ => _.FindByEmail(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _businessPartnerController.GetByEmail(emailMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<BusinessPartnerDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(individualMock, response.Data);

            _businessPartnerServiceMock.Verify(_ => _.FindByEmail(It.IsAny<string>()), Times.Once);
        }
    }
}
