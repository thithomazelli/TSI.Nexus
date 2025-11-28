using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class IndividualServiceTests
    {
        private readonly IndividualService _IndividualService;
        private readonly Mock<IRepository<Individual>> _repository;
        private readonly IList<Individual> _individualListMock;

        public IndividualServiceTests()
        {
            _repository = new Mock<IRepository<Individual>>();
            _IndividualService = new IndividualService(_repository.Object);

            _individualListMock = new List<Individual>
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
        public void IndividualService_Add_ShouldAddIndividualSuccessfully_WhenMethodIsCalledWithAValidObjectAndIndividualIsNotDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} cadastrado com sucesso."
            };

            _repository.Setup(_ => _.Add(It.IsAny<Individual>()));
            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>());

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Data, individualMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Once);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public void IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {individualMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {individualMock.Email}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenSocialSecurityCardIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CPF {individualMock.SocialSecurityCard}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public void IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenNationalIdCardIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o RG {individualMock.NationalIdCard}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public void IndividualService_Add_ShouldNotAddIndividualAndReturnAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível cadastrar o Cliente {individualMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>());
            _repository.Setup(_ => _.Add(It.IsAny<Individual>()))
                .Throws(exception);

            // Act
            var result = _IndividualService.Add(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Update_ShouldUpdateIndividualSuccessfully_WhenMethodIsCalledWithAValidObjectAndIndividualIsNotDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };

            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} atualizado com sucesso."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>());
            _repository.Setup(_ => _.Update(It.IsAny<Individual>()));

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Data, individualMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com Nome {individualMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenEmailIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com E-mail {individualMock.Email}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void IndividualService_Update_ShouldNotUpdateIndividualAndReturnAnErrorMessage_WhenSocialSecurityCardIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o CPF {individualMock.SocialSecurityCard}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(3));
        }

        [Fact]
        public void IndividualService_Update_ShouldUpdateAddIndividualAndReturnAnErrorMessage_WhenNationalIdCardIsDuplicated()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                SocialSecurityCard = "111.222.333-44",
                NationalIdCard = "11.222.333-4"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Cliente cadastrado com o RG {individualMock.NationalIdCard}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual>())
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Exactly(4));
        }

        [Fact]
        public void IndividualService_Update_ShouldNotUpdateIndividualAndReturnAndErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar os dados do Cliente {individualMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>());
            _repository.Setup(_ => _.Update(It.IsAny<Individual>()))
                .Throws(exception);

            // Act
            var result = _IndividualService.Update(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Remove_ShouldRemoveIndividualSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Individual>()));

            // Act
            var result = _IndividualService.Remove(individualMock);

            // Assert
            Assert.Equal(expectedResult.Data, individualMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualService_Remove_ShouldNotRemoveIndividualAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var individualMock = new Individual
            {
                Id = 1,
                Name = "Thiago Thomazelli Ferreira"
            };
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Cliente {individualMock.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Individual>()))
                .Throws(exception);

            // Act
            var result = _IndividualService.Remove(individualMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Individual>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = _individualListMock,
                Status = ResponseStatus.Success,
                Message = $"{_individualListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(_individualListMock);

            // Act
            var result = _IndividualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void IndividualService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = new List<Individual>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(new List<Individual>());

            // Act
            var result = _IndividualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void IndividualService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetAll())
                .Throws(exception);

            // Act
            var result = _IndividualService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void IndividualService_FindById_ShouldReturnAnIndividualSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var individualMock = _individualListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(individualMock);

            // Act
            var result = _IndividualService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void IndividualService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o ID {idMock} foi encontrado"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(value: null);

            // Act
            var result = _IndividualService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void IndividualService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Throws(exception);

            // Act
            var result = _IndividualService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void IndividualService_FindByEmail_ShouldReturnALisfOfIndividualsSuccessfully_WhenEmailIsValid()
        {
            // Arrange
            const string emailMock = "thiago.thomazelli@tsi.com.br";
            var individualMock = _individualListMock.FirstOrDefault(_ => emailMock.Equals(_.Email));
            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = new List<Individual> { individualMock },
                Status = ResponseStatus.Success,
                Message = $"{1} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindByEmail_ShouldReturnAnEmptyData_WhenEmailIsNotFound()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var expectedResult = new WebApiResponse<IEnumerable<Individual>>
            {
                Data = new List<Individual>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual>());

            // Act
            var result = _IndividualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindByEmail_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string emailMock = "thiago@tsi.com";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Throws(exception);

            // Act
            var result = _IndividualService.FindByEmail(emailMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindBySocialSecurityCard_ShouldReturnAnIndividualSuccessfully_WhenFindBySocialSecurityCardIsValid()
        {
            // Arrange
            const string socialSecurityCardMock = "111.222.333-44";
            var individualMock = _individualListMock.FirstOrDefault(_ => socialSecurityCardMock.Equals(_.SocialSecurityCard));
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = individualMock,
                Status = ResponseStatus.Success,
                Message = $"Cliente {individualMock.Name} encontrado com sucesso."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(new List<Individual> { individualMock });

            // Act
            var result = _IndividualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindBySocialSecurityCard_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenFindBySocialSecurityCardIsInvalid()
        {
            // Arrange
            const string socialSecurityCardMock = "000.000.000-00";
            var expectedResult = new WebApiResponse<Individual>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Cliente com o CPF {socialSecurityCardMock} foi encontrado"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Returns(value: null);

            // Act
            var result = _IndividualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }

        [Fact]
        public void IndividualService_FindBySocialSecurityCard_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string socialSecurityCardMock = "000.000.000-00";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Individual>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()))
                .Throws(exception);

            // Act
            var result = _IndividualService.FindBySocialSecurityCard(socialSecurityCardMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Individual, bool>>>()), Times.Once);
        }
    }
}