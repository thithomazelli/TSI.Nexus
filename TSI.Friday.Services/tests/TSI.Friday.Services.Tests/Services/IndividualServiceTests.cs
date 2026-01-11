using AutoMapper;
using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;

namespace TSI.Friday.Services.Tests.Services
{
    public class IndividualServiceTests
    {
        private readonly IndividualService _individualService;
        private readonly Mock<IRepository<Individual>> _repository;
        private readonly IList<ClientDto> _clientListMock;
        private readonly IMapper _mapper;

        public IndividualServiceTests()
        {
            _repository = new Mock<IRepository<Individual>>();

            // Configure AutoMapper for tests
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();

            _individualService = new IndividualService(_repository.Object, _mapper);

            _clientListMock = new List<ClientDto>
                {
                    new()
                    {
                        Id = 1,
                        Name = "Thiago Thomazelli Ferreira",
                        Email = "thiago.thomazelli@tsi.com.br",
                        SocialSecurityCard = "111.222.333-44",
                        NationalIdCard = "11.222.333-4",
                        Birthday = DateTime.Now
                    },
                    new()
                    {
                        Id = 2,
                        Name = "Leonardo Thomazelli Ferreira",
                        Email = "leonardo.thomazelli@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(1)
                    },
                    new()
                    {
                        Id = 3,
                        Name = "Fábio Moraes",
                        Email = "fabio.moraes@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(2)
                    },
                    new()
                    {
                        Id = 4,
                        Name = "Felipe Rocha",
                        Email = "felipe.rocha@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(3)
                    },
                    new()
                    {
                        Id = 5,
                        Name = "Renan Amarantes Fernandes",
                        Email = "renan.fernandes@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(4)
                    },
                    new()
                    {
                        Id = 6,
                        Name = "Rafael Spessotto",
                        Email = "rafael.spessotto@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(-5)
                    },
                    new()
                    {
                        Id = 7,
                        Name = "Administrator",
                        Email = "admin@tsi.com.br",
                        Birthday = DateTime.Now.AddDays(5)
                    }
                };
        }

        [Fact]
        public async Task IndividualService_Add_ShouldAddIndividualSuccessfully_WhenMethodIsCalledWithAValidObjectAndIndividualIsNotDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} cadastrado com sucesso."
            };

            _repository.Setup(_ => _.AddAsync(It.IsAny<Individual>()));
            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Data, clientMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Once);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public async Task IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {clientMock.Name}."
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {clientMock.Email}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public async Task IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenSocialSecurityCardIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CPF {clientMock.SocialSecurityCard}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public async Task IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenNationalIdCardIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o RG {clientMock.NationalIdCard}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public async Task IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Cliente {clientMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(new List<Individual>());
            _repository.Setup(_ => _.AddAsync(It.IsAny<Individual>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.Add(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Update_ShouldUpdateIndividualSuccessfully_WhenMethodIsCalledWithAValidObjectAndIndividualIsNotDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };

            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} atualizado com sucesso."
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(new List<Individual>());
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Individual>()));

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Data, clientMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {clientMock.Name}."
            };

            _repository.Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {clientMock.Email}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public async Task IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenSocialSecurityCardIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CPF {clientMock.SocialSecurityCard}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public async Task IndividualService_Update_ShouldUpdateAddIndividualAndReturnAnErrorMessage_WhenNationalIdCardIsDuplicated()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o RG {clientMock.NationalIdCard}."
            };

            _repository.SetupSequence(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.AnyAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public async Task IndividualService_Update_ShouldNotUpdateIndividualAndReturnAndErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar os dados do Cliente {clientMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(new List<Individual>());
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Individual>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.Update(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Remove_ShouldRemoveIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Individual>()));

            // Act
            var result = await _individualService.Remove(clientMock);

            // Assert
            Assert.Equal(expectedResult.Data, clientMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_Remove_ShouldNotRemoveIndividualAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {clientMock.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Individual>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.Remove(clientMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = _clientListMock,
                Status = ResponseStatus.Success,
                Message = $"{_clientListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(_mapper.Map<List<Individual>>(_clientListMock));

            // Act
            var result = await _individualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = new List<ClientDto>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(new List<Individual>());

            // Act
            var result = await _individualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
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
            var result = await _individualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindById_ShouldReturnAnIndividualSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var clientMock = _clientListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(_mapper.Map<Individual>(clientMock));

            // Act
            var result = await _individualService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o ID {idMock} foi encontrado"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(value: null);

            // Act
            var result = await _individualService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindByEmail_ShouldReturnALisfOfIndividualsSuccessfully_WhenEmailIsValid()
        {
            // Arrange
            const string emailMock = "thiago.thomazelli@tsi.com.br";
            var clientMock = _clientListMock.FirstOrDefault(_ => emailMock.Equals(_.Email));
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(_mapper.Map<Individual>(clientMock));

            // Act
            var result = await _individualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindByEmail_ShouldReturnAnEmptyData_WhenEmailIsNotFound()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o E-mail {emailMock} foi encontrado."
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(value: null);

            // Act
            var result = await _individualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindByEmail_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindBySocialSecurityCard_ShouldReturnAnIndividualSuccessfully_WhenFindBySocialSecurityCardIsValid()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var clientMock = _clientListMock.FirstOrDefault(_ => socialSecurityCardMock.Equals(_.SocialSecurityCard));
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(_mapper.Map<Individual>(clientMock));

            // Act
            var result = await _individualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindBySocialSecurityCard_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenFindBySocialSecurityCardIsInvalid()
        {
            // Arrange
            const string socialSecurityCardMock = "000.000.000-00";
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o CPF {socialSecurityCardMock} foi encontrado"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ReturnsAsync(value: null);

            // Act
            var result = await _individualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task IndividualService_FindBySocialSecurityCard_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string socialSecurityCardMock = "000.000.000-00";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _individualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }
    }
}