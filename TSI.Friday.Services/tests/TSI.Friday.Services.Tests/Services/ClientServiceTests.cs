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
    public class ClientServiceTests
    {
        private readonly ClientService _clientService;
        private readonly Mock<IRepository<Client>> _repository;
        private readonly IList<Client> _clientListMock;
        private readonly IMapper _mapper;

        public ClientServiceTests()
        {
            _repository = new Mock<IRepository<Client>>();

            // Configure AutoMapper for tests (map Client -> ClientDto, including derived-type fields)
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });
            _mapper = config.CreateMapper();

            _clientService = new ClientService(_repository.Object, _mapper);

            _clientListMock = new List<Client>
            {
                new Company
                {
                    Id = 1,
                    Name = "TSI Soluções em Informática",
                    Email = "thiago.thomazelli@tsi.com.br",
                }
            };
        }

        [Fact]
        public async Task ClientService_Remove_ShouldRemoveClientSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "TSI Soluções em Informática",
                Type = "Física"
            };
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = clientMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(_mapper.Map<Individual>(clientMock));
            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Client>()));

            // Act
            var result = await _clientService.Remove(clientMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.GetByIdAsync(It.IsAny<int>()), Times.Once);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Client>()), Times.Once);
        }

        [Fact]
        public async Task ClientService_Remove_ShouldNotRemoveClientAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };
            var expectedResult = new WebApiResponse<Client>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {clientMock.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(new Company());
            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Client>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _clientService.Remove(clientMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.GetByIdAsync(It.IsAny<int>()), Times.Once);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Client>()), Times.Once);
        }

        [Fact]
        public async Task ClientService_Remove_ShouldNotRemoveClientAndReturnsAndError_WhenClientIsNotFound()
        {
            // Arrange
            var clientMock = new ClientDto
            {
                Id = 1,
                Name = "TSI Soluções em Informática"
            };

            var exception = new Exception($"Cliente com Id {clientMock.Id} não encontrado.");
            var expectedResult = new WebApiResponse<Client>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {clientMock.Name} da base de dados. Erro: {exception.Message}"
            };


            _repository.Setup(_ => _.GetByIdAsync(It.IsAny<int>())).ThrowsAsync(exception);

            // Act
            var result = await _clientService.Remove(clientMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Client>()), Times.Never);
        }

        [Fact]
        public async Task ClientService_FindById_ShouldReturnAClientSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var clientMock = _clientListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedResult = new WebApiResponse<ClientDto>
            {
                Data = _mapper.Map<ClientDto>(clientMock),
                Status = ResponseStatus.Success,
                Message = $"Cliente {clientMock.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(clientMock);

            // Act
            var result = await _clientService.FindById(idMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task ClientService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
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
            var result = await _clientService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task ClientService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
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
            var result = await _clientService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task ClientService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = _mapper.Map<IEnumerable<ClientDto>>(_clientListMock),
                Status = ResponseStatus.Success,
                Message = $"{_clientListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(_clientListMock);

            // Act
            var result = await _clientService.FindAll();

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task ClientService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<ClientDto>>
            {
                Data = new List<ClientDto>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAllAsync())
                .ReturnsAsync(new List<Client>());

            // Act
            var result = await _clientService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task ClientService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
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
            var result = await _clientService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAllAsync(), Times.Once);
        }
    }
}