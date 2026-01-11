using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class CompanyServiceTests
    {
        private readonly CompanyService _companyService;
        private readonly Mock<IRepository<Company>> _repository;
        private readonly IList<Company> _companyListMock;
        private readonly IMapper _mapper;

        public CompanyServiceTests()
        {
            _repository = new Mock<IRepository<Company>>();
            _mapper = new MapperConfiguration(cfg => cfg.AddProfile(new TSI.Friday.IoC.MappingProfile())).CreateMapper();
            _companyService = new CompanyService(_repository.Object, _mapper);

            _companyListMock = new List<Company>
                {
                    new()
                    {
                        Id =1,
                        Name = "TSI Soluções em Informática",
                        Email = "thiago.thomazelli@tsi.com.br",
                        NationalRegistry = "11.222.3333/0001-44",
                        StateRegistration = "11.222.333-4",
                        BusinessName = "",
                    }
                };
        }

        [Fact]
        public async Task CompanyService_Add_ShouldAddCompanySuccessfully_WhenMethodIsCalledWithAValidObjectAndCompanyIsNotDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = companyDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyDto.Name} cadastrado com sucesso."
            };

            _repository.Setup(_ => _.AddAsync(It.IsAny<Company>()));
            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _companyService.Add(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Company>()), Times.Once);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public async Task CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {companyDto.Name}."
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Add(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {companyDto.Email}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Add(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public async Task CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenNationalRegistryIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.3333/0001-44"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CNPJ {companyDto.NationalRegistry}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Add(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public async Task CompanyService_Add_ShouldNotAddCompanyAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Cliente {companyDto.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(false);
            _repository.Setup(_ => _.AddAsync(It.IsAny<Company>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.Add(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Update_ShouldUpdateCompanySuccessfully_WhenMethodIsCalledWithAValidObjectAndCompanyIsNotDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = companyDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyDto.Name} atualizado com sucesso."
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(false);
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Company>()));

            // Act
            var result = await _companyService.Update(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {companyDto.Name}."
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Update(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {companyDto.Email}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Update(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public async Task CompanyService_Update_ShouldNotUpdateCompanyAndReturnAnErrorMessage_WhenNationalRegistryIsDuplicated()
        {
            // Arrange
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática",
                Email = "thiago.thomazelli@tsi.com.br",
                NationalRegistry = "11.222.3333/0001-44"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CNPJ {companyDto.NationalRegistry}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _companyService.Update(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Company>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public async Task CompanyService_Update_ShouldNotUpdateCompanyAndReturnAndErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyDto = new ClientDto
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar os dados do Cliente {companyDto.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(false);
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Company>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.Update(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Remove_ShouldRemoveCompanySuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var companyEntity = new Company
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };

            var companyDto = _mapper.Map<ClientDto>(companyEntity);

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = companyDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {companyEntity.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.GetByIdAsync(It.IsAny<int?>()))
                .ReturnsAsync(companyEntity);
            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Company>()));

            // Act
            var result = await _companyService.Remove(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_Remove_ShouldNotRemoveCompanyAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var companyEntity = new Company
            {
                Id =1,
                Name = "TSI Soluções em Informática"
            };

            var companyDto = _mapper.Map<ClientDto>(companyEntity);

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {companyDto.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetByIdAsync(It.IsAny<int?>()))
                .ReturnsAsync(companyEntity);
            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Company>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.Remove(companyDto);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Company>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedDtos = _mapper.Map<IEnumerable<ClientDto>>(_companyListMock);
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = expectedDtos,
                Status = ResponseStatus.Success,
                Message = $"{expectedDtos.Count()} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(_companyListMock);

            // Act
            var result = await _companyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = new List<ClientDto>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(new List<Company>());

            // Act
            var result = await _companyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Empty(result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindById_ShouldReturnAnCompanySuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock =1;
            var companyEntity = _companyListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedDto = _mapper.Map<ClientDto>(companyEntity);
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = expectedDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {expectedDto.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(companyEntity);

            // Act
            var result = await _companyService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock =10;
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o ID {idMock} foi encontrado"
            };

            _ = _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(value: null as Company);

            // Act
            var result = await _companyService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock =1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByEmail_ShouldReturnALisfOfCompanysSuccessfully_WhenEmailIsValid()
        {
            // Arrange
            const string emailMock = "thiago.thomazelli@tsi.com.br";
            var companyEntity = _companyListMock.FirstOrDefault(_ => emailMock.Equals(_.Email));
            var expectedDto = _mapper.Map<ClientDto>(companyEntity);
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = expectedDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {expectedDto.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(companyEntity);

            // Act
            var result = await _companyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByEmail_ShouldReturnAnEmptyData_WhenEmailIsNotFound()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o E-mail {emailMock} foi encontrado"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(null as Company);

            // Act
            var result = await _companyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByEmail_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByNationalRegistry_ShouldReturnAnCompanySuccessfully_WhenFindByNationalRegistryIsValid()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var companyEntity = _companyListMock.FirstOrDefault(_ => nationalRegistraMock.Equals(_.NationalRegistry));
            var expectedDto = _mapper.Map<ClientDto>(companyEntity);
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = expectedDto,
                Status = ResponseStatus.Success,
                Message = $"Cliente {expectedDto.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(companyEntity);

            // Act
            var result = await _companyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);
            Assert.Equal(expectedResult.Data, result.Data);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByNationalRegistry_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenFindByNationalRegistryIsInvalid()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o CNPJ {nationalRegistraMock} foi encontrado"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ReturnsAsync(value: null as Company);

            // Act
            var result = await _companyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task CompanyService_FindByNationalRegistry_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string nationalRegistraMock = "11.222.3333/0001-44";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>() ))
                .ThrowsAsync(exception);

            // Act
            var result = await _companyService.FindByNationalRegistry(nationalRegistraMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Company, bool>>>()), Times.Once);
        }
    }
}