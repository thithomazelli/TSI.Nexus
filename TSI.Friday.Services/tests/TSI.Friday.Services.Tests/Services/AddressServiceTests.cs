using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Services.Tests.Services
{
    public class AddressServiceTests
    {
        private readonly AddressService _addressService;
        private readonly Mock<IRepository<Address>> _repository;
        private readonly IList<Address> _addressListMock;

        public AddressServiceTests()
        {
            _repository = new Mock<IRepository<Address>>();
            _addressService = new AddressService(_repository.Object);
            _addressListMock = new List<Address>
            {
                new Address
                {
                    Id = 1,
                    PersonId = 1,
                    AddressType = AddressType.Home,
                    Country = "Brasil",
                    City = "Santo André",
                    State = "SP",
                    ZipCode = "09190-620",
                    Street = "Rua Juazeiro",
                    Number = 303,
                    Comments = "Apto 21"
                },
                new Address
                {
                    Id = 2,
                    PersonId = 1,
                    AddressType = AddressType.Office,
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
        public void AddressService_Add_ShouldAddAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço cadastrado com sucesso."
            };

            _repository.Setup(_ => _.Add(It.IsAny<Address>()));

            // Act
            var result = _addressService.Add(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_Add_ShouldNotAddAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Add(It.IsAny<Address>()))
                .Throws(exception);

            // Act
            var result = _addressService.Add(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_Update_ShouldUpdateAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço atualizado com sucesso."
            };

            _repository.Setup(_ => _.Update(It.IsAny<Address>()));

            // Act
            var result = _addressService.Update(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_Update_ShouldNotUpdateAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Update(It.IsAny<Address>()))
                .Throws(exception);

            // Act
            var result = _addressService.Update(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_Remove_ShouldRemoveAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço removido com sucesso."
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Address>()));

            // Act
            var result = _addressService.Remove(addressMock);

            // Assert
            Assert.Equal(expectedResult.Data, addressMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_Remove_ShouldNotRemoveAddressAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var addressMock = _addressListMock.FirstOrDefault();
            var expectedResult = new WebApiResponse<Address>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Address>()))
                .Throws(exception);

            // Act
            var result = _addressService.Remove(addressMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Address>()), Times.Once);
        }

        [Fact]
        public void AddressService_FindById_ShouldReturnAnAddressSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var addressMock = _addressListMock.FirstOrDefault(_ => idMock.Equals(_.PersonId));
            var expectedResult = new WebApiResponse<Address>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = "Endereço foi encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(addressMock);

            // Act
            var result = _addressService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void AddressService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<Address>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Endereço com o ID {idMock} foi encontrado"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(value: null);

            // Act
            var result = _addressService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void AddressService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Person>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Throws(exception);

            // Act
            var result = _addressService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void AddressService_FindByPersonId_ShouldReturnALisfOfAddressesSuccessfully_WhenPersonIdIsValid()
        {
            // Arrange
            const int personIdMock = 1;
            var expectedResult = new WebApiResponse<IEnumerable<Address>>
            {
                Data = _addressListMock,
                Status = ResponseStatus.Success,
                Message = $"{_addressListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()))
                .Returns(_addressListMock);

            // Act
            var result = _addressService.FindByPersonId(personIdMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

        [Fact]
        public void AddressService_FindByPersonId_ShouldReturnAnEmptyData_WhenPersonIdIsInvalid()
        {
            // Arrange
            const int personIdMock = 10;
            var expectedResult = new WebApiResponse<IEnumerable<Address>>
            {
                Data = new List<Address>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()))
                .Returns(new List<Address>());

            // Act
            var result = _addressService.FindByPersonId(personIdMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

        [Fact]
        public void AddressService_FindByPersonId_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int personIdMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Person>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()))
                .Throws(exception);

            // Act
            var result = _addressService.FindByPersonId(personIdMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Address, bool>>>()), Times.Once);
        }

    }
}
