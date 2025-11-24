using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Services.Tests.Services
{
    public class CompanyServiceTests
    {
        private readonly CompanyService _CompanyService;
        private readonly Mock<IRepository<Company>> _repository;
        private readonly IList<Company> _individualListMock;

        public CompanyServiceTests()
        {
            _repository = new Mock<IRepository<Company>>();
            _CompanyService = new CompanyService(_repository.Object);

            _individualListMock = new List<Company>
                {
                    new()
                    {
                        Id = 1,
                        Name = "TSI Soluções em Informática",
                        Email = "thiago.thomazelli@tsi.com.br",
                        NationalRegistry = "11.222.3333/0001-44",
                        StateRegistration = "11.222.333-4",
                        BusinessName = "",
                    }
                };
        }

        [Fact]
        public void CompanyService_Add_ShouldAddCompanySuccessfully_WhenMethodIsCalledWithAValidObjectAndCompanyIsNotDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyMock.Name} cadastrado com sucesso."
            };

            _repository.Setup(_ => _.Add(It.IsAny<Company>()));
            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>());

            // Act
            var result = _CompanyService.Add(companyMock);

            // Assert
            Assert.Equal(expectedResult.Data, companyMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Company>()), Times.Once);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public void CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {companyMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Add(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {companyMock.Email}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>())
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Add(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenNationalRegistryIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.3333/0001-44"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CNPJ {companyMock.NationalRegistry}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>())
                .Returns(new List<Company>())
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Add(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public void CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Cliente {companyMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>());
            _repository.Setup(_ => _.Add(It.IsAny<Company>()))
                .Throws(exception);

            // Act
            var result = _CompanyService.Add(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Update_ShouldUpdateCompanySuccessfully_WhenMethodIsCalledWithAValidObjectAndCompanyIsNotDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };

            var expectedResult = new WebApiResponse<Company>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyMock.Name} atualizado com sucesso."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>());
            _repository.Setup(_ => _.Update(It.IsAny<Company>()));

            // Act
            var result = _CompanyService.Update(companyMock);

            // Assert
            Assert.Equal(expectedResult.Data, companyMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {companyMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Update(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {companyMock.Email}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>())
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Update(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenNationalRegistryIsDuplicated()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.3333/0001-44"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CNPJ {companyMock.NationalRegistry}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>())
                .Returns(new List<Company>())
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.Update(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public void CompanyService_Update_ShouldNotUpdateCompanyAndReturnAndErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar os dados do Cliente {companyMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>());
            _repository.Setup(_ => _.Update(It.IsAny<Company>()))
                .Throws(exception);

            // Act
            var result = _CompanyService.Update(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Remove_ShouldRemoveCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyMock.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Company>()));

            // Act
            var result = _CompanyService.Remove(companyMock);

            // Assert
            Assert.Equal(expectedResult.Data, companyMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public void CompanyService_Remove_ShouldNotRemoveCompanyAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyMock = new Company
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {companyMock.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Company>()))
                .Throws(exception);

            // Act
            var result = _CompanyService.Remove(companyMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Company>>
            {
                Data = _individualListMock,
                Status = ResponseStatus.Success,
                Message = $"{_individualListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(_individualListMock);

            // Act
            var result = _CompanyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void CompanyService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Company>>
            {
                Data = new List<Company>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(new List<Company>());

            // Act
            var result = _CompanyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void CompanyService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var expectedResult = new WebApiResponse<IEnumerable<Company>>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetAll())
                .Throws(exception);

            // Act
            var result = _CompanyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void CompanyService_FindById_ShouldReturnAnCompanySuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var companyMock = _individualListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedResult = new WebApiResponse<Company>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyMock.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(companyMock);

            // Act
            var result = _CompanyService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void CompanyService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<Company>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o ID {idMock} foi encontrado"
            };

            _ = _repository.Setup(_ => _.GetById(idMock))
                .Returns(value: null);

            // Act
            var result = _CompanyService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void CompanyService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Throws(exception);

            // Act
            var result = _CompanyService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByEmail_ShouldReturnALisfOfCompanysSuccessfully_WhenEmailIsValid()
        {
            // Arrange
            const string emailMock = "thiago.thomazelli@tsi.com.br";
            var companyMock = _individualListMock.FirstOrDefault(_ => emailMock.Equals(_.Email));
            var expectedResult = new WebApiResponse<IEnumerable<Company>>
            {
                Data = new List<Company> { companyMock },
                Status = ResponseStatus.Success,
                Message = $"{1} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByEmail_ShouldReturnAnEmptyData_WhenEmailIsNotFound()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var expectedResult = new WebApiResponse<IEnumerable<Company>>
            {
                Data = new List<Company>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company>());

            // Act
            var result = _CompanyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByEmail_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Throws(exception);

            // Act
            var result = _CompanyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByNationalRegistry_ShouldReturnAnCompanySuccessfully_WhenFindByNationalRegistryIsValid()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var companyMock = _individualListMock.FirstOrDefault(_ => nationalRegistraMock.Equals(_.NationalRegistry));
            var expectedResult = new WebApiResponse<Company>
            {
                Data = companyMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyMock.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(new List<Company> { companyMock });

            // Act
            var result = _CompanyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByNationalRegistry_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenFindByNationalRegistryIsInvalid()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var expectedResult = new WebApiResponse<Company>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o CNPJ {nationalRegistraMock} foi encontrado"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Returns(value: null);

            // Act
            var result = _CompanyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public void CompanyService_FindByNationalRegistry_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Company>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()))
                .Throws(exception);

            // Act
            var result = _CompanyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }
    }
}