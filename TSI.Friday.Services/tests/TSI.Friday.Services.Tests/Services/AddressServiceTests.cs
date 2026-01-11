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
    public class AddressServiceTests
    {
        private readonly AddressService _addressService;
        private readonly Mock<IRepository<Address>> _repository;
        private readonly IList<AddressDto> _addressListMock;
        private readonly IMapper _mapper;

        public AddressServiceTests()
        {
            // Configure AutoMapper for tests (map Client -> ClientDto, including derived-type fields)
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });
            _mapper = config.CreateMapper();

            _repository = new Mock<IRepository<Address>>();
            _addressService = new AddressService(_repository.Object, _mapper);
            _addressListMock = new List<AddressDto>
            {
                new AddressDto
                {
                    Id = 1,
                    ClientId = 1,
                    Type = AddressType.Home,
                    Country = "Brasil",
                    City = "Santo André",
                    State = "SP",
                    ZipCode = "09190-620",
                    Street = "Rua Juazeiro",
                    Number = 303,
                    Comments = "Apto 21",
                    IsDefault = true,
                },
                new AddressDto
                {
                    Id = 2,
                    ClientId = 1,
                    Type = AddressType.Office,
                    Country = "Brasil",
                    City = "Santo André",
                    State = "SP",
                    ZipCode = "09260-290",
                    Street = "Rua Osório de Almeida",
                    Number = 950,
                    Comments = ""
                }
            };
        }

        [Fact]
        public async Task AddressService_Add_ShouldAddAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço cadastrado com sucesso."
            };

            _repository.Setup(_ => _.AddAsync(It.IsAny<Address>()));

            // Act
            var result = await _addressService.Add(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_Add_ShouldNotAddAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.AddAsync(It.IsAny<Address>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _addressService.Add(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_Update_ShouldUpdateAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço atualizado com sucesso."
            };

            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Address>()));

            // Act
            var result = await _addressService.Update(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_Update_ShouldNotUpdateAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Address>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _addressService.Update(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_Remove_ShouldRemoveAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço removido com sucesso."
            };

            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Address>()));

            // Act
            var result = await _addressService.Remove(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_Remove_ShouldNotRemoveAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.RemoveAsync(It.IsAny<Address>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _addressService.Remove(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindById_ShouldReturnAnAddressSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var addressMock = _addressListMock.FirstOrDefault(_ => idMock.Equals(_.ClientId));
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço foi encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(_mapper.Map<Address>(addressMock));

            // Act
            var result = await _addressService.FindById(idMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Endereço com o ID {idMock} foi encontrado"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ReturnsAsync(value: null);

            // Act
            var result = await _addressService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<AddressDto>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetByIdAsync(idMock))
                .ThrowsAsync(exception);

            // Act
            var result = await _addressService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetByIdAsync(idMock), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindByClientId_ShouldReturnALisfOfAddressesSuccessfully_WhenClientIdIsValid()
        {
            // Arrange
            const int clientIdMock = 1;
            var expectedResult = new WebApiResponse<IEnumerable<AddressDto>>
            {
                Data = _addressListMock,
                Status = ResponseStatus.Success,
                Message = $"{_addressListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()))
                .ReturnsAsync(_mapper.Map<IList<Address>>(_addressListMock));

            // Act
            var result = await _addressService.FindByClientId(clientIdMock);

            // Assert
            expectedResult.Should().BeEquivalentTo(result);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            _repository.Verify(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindByClientId_ShouldReturnAnEmptyData_WhenClientIdIsInvalid()
        {
            // Arrange
            const int clientIdMock = 10;
            var expectedResult = new WebApiResponse<IEnumerable<AddressDto>>
            {
                Data = new List<AddressDto>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()))
                .ReturnsAsync(new List<Address>());

            // Act
            var result = await _addressService.FindByClientId(clientIdMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

        [Fact]
        public async Task AddressService_FindByClientId_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int clientIdMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<IEnumerable<AddressDto>>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()))
                .ThrowsAsync(exception);

            // Act
            var result = await _addressService.FindByClientId(clientIdMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.QueryAsync(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

    }
}
