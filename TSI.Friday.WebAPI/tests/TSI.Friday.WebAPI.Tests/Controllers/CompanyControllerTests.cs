using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class CompanyControllerTests
{
    private readonly CompanyController _companyController;
    private readonly Mock<ICompanyService> _companyServiceMock;

    public CompanyControllerTests()
    {
        _companyServiceMock = new Mock<ICompanyService>();
        _companyController = new CompanyController(_companyServiceMock.Object);
    }

    [Fact]
    public void CompanyController_Add_ShouldAddCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
    {
        // Arrange
        var companyMock = new Company
        {
            Name = "Thiago Thomazelli Ferreira",
            Email = "thiago.thomazelli@tsi.com.br",
            NationalRegistry = "11.222.333/0001-44",
        };

        var expectedResult = new WebApiResponse<Company>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"Cliente {companyMock.Name} cadastrado com sucesso."
        };

        _companyServiceMock.Setup(_ => _.Add(It.IsAny<Company>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.Add(companyMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<Company>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.Add(It.IsAny<Company>()), Times.Once);
    }

    [Fact]
    public void CompanyController_Add_ShouldNotAddCompanySuccessfully_WhenMethodIsCalledWithAnInvalidObject()
    {
        // Arrange
        var companyMock = new Company();

        _companyController.ModelState.AddModelError("Name", "Name is required");

        _companyServiceMock.Setup(_ => _.Add(It.IsAny<Company>()));

        // Act
        var result = _companyController.Add(companyMock);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var modelState = Assert.IsType<SerializableError>(badRequest.Value);
        Assert.True(modelState.ContainsKey("Name"));

        _companyServiceMock.Verify(_ => _.Add(It.IsAny<Company>()), Times.Never);
    }

    [Fact]
    public void CompanyController_Update_ShouldUpdateCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
    {
        // Arrange
        var companyMock = new Company
        {
            Name = "Thiago Thomazelli Ferreira",
            Email = "thiago.thomazelli@tsi.com.br",
            NationalRegistry = "11.222.333/0001-44",
        };

        var expectedResult = new WebApiResponse<Company>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"Cliente {companyMock.Name} atualizado com sucesso."
        };

        _companyServiceMock.Setup(_ => _.Update(It.IsAny<Company>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.Update(companyMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<Company>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.Update(It.IsAny<Company>()), Times.Once);
    }

    [Fact]
    public void CompanyController_Update_ShouldNotUpdateCompanySuccessfully_WhenMethodIsCalledWithAnInvalidObject()
    {
        // Arrange
        var companyMock = new Company();

        _companyController.ModelState.AddModelError("Name", "Name is duplicated");

        _companyServiceMock.Setup(_ => _.Update(It.IsAny<Company>()));

        // Act
        var result = _companyController.Update(companyMock);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var modelState = Assert.IsType<SerializableError>(badRequest.Value);
        Assert.True(modelState.ContainsKey("Name"));

        _companyServiceMock.Verify(_ => _.Update(It.IsAny<Company>()), Times.Never);
    }

    [Fact]
    public void CompanyController_Remove_ShouldRemoveCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
    {
        // Arrange
        var companyMock = new Company
        {
            Name = "Thiago Thomazelli Ferreira",
            Email = "thiago.thomazelli@tsi.com.br",
            NationalRegistry = "11.222.333/0001-44",
        };

        var expectedResult = new WebApiResponse<Company>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"Cliente {companyMock.Name} removido com sucesso."
        };

        _companyServiceMock.Setup(_ => _.Remove(It.IsAny<Company>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.Remove(companyMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<Company>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.Remove(It.IsAny<Company>()), Times.Once);
    }

    [Fact]
    public void CompanyController_GetAll_ShouldGetAllCompany_WhenMethodIsCalled()
    {
        // Arrange
        var companyMock = new List<Company>
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

        var expectedResult = new WebApiResponse<IEnumerable<Company>>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"{companyMock.Count()} registro(s) encontrado(s)."
        };

        _companyServiceMock.Setup(_ => _.FindAll())
            .Returns(expectedResult);

        // Act
        var result = _companyController.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<IEnumerable<Company>>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.FindAll(), Times.Once);
    }

    [Fact]
    public void CompanyController_GetById_ShouldGetCompanyById_WhenMethodIsCalled()
    {
        // Arrange
        const int idMock = 1;
        var companyMock = new Company
        {
            Id = idMock,
            Name = "Thiago Thomazelli Ferreira",
            Email = "thiago.thomazelli@tsi.com.br",
            NationalRegistry = "11.222.333/0001-44",
        };

        var expectedResult = new WebApiResponse<Company>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"Cliente {companyMock.Name} encontrado com sucesso"
        };

        _companyServiceMock.Setup(_ => _.FindById(It.IsAny<int?>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.GetById(idMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<Company>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.FindById(It.IsAny<int?>()), Times.Once);
    }

    [Fact]
    public void CompanyController_GetByEmail_ShouldGetCompanyByEmail_WhenMethodIsCalled()
    {
        // Arrange
        var emailMock = "thiago.thomazelli@tsi.com.br";
        var companyMock = new List<Company>
            {
                new()
                {
                    Name = "Thiago Thomazelli Ferreira",
                    Email = emailMock,
                    NationalRegistry = "11.222.333/0001-44",
                }
            };

        var expectedResult = new WebApiResponse<IEnumerable<Company>>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"{companyMock.Count()} registro(s) encontrado(s)."
        };

        _companyServiceMock.Setup(_ => _.FindByEmail(It.IsAny<string>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.GetByEmail(emailMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<IEnumerable<Company>>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.FindByEmail(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public void CompanyController_GetBySocialSecurityCard_ShouldGetCompanyBySocialSecurityCard_WhenMethodIsCalled()
    {
        // Arrange
        const string socialSecurityCardMock = "111.222.333-44";
        var companyMock = new Company
        {
            Name = "Thiago Thomazelli Ferreira",
            Email = "thiago.thomazelli@tsi.com.br",
            NationalRegistry = "11.222.333/0001-44",
        };

        var expectedResult = new WebApiResponse<Company>
        {
            Data = companyMock,
            Status = ResponseStatus.Success,
            Message = $"Cliente {companyMock.Name} encontrado com sucesso."
        };

        _companyServiceMock.Setup(_ => _.FindByNationalRegistry(It.IsAny<string>()))
            .Returns(expectedResult);

        // Act
        var result = _companyController.GetByNationalRegistry(socialSecurityCardMock);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<WebApiResponse<Company>>(okResult.Value);
        Assert.Equal(ResponseStatus.Success, response.Status);
        Assert.Equal(companyMock, response.Data);

        _companyServiceMock.Verify(_ => _.FindByNationalRegistry(It.IsAny<string>()), Times.Once);
    }
}
}