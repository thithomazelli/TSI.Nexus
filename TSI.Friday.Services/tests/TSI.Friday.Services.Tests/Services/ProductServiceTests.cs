using FluentAssertions;
using Moq;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.Services.Services;

namespace TSI.Friday.Services.Tests.Services
{
    public class ProductServiceTests
    {
        private readonly ProductService _ProductService;
        private readonly Mock<IRepository<Product>> _repository;
        private readonly IList<Product> _productListMock;

        public ProductServiceTests()
        {
            _repository = new Mock<IRepository<Product>>();
            _ProductService = new ProductService(_repository.Object);

            _productListMock = new List<Product>
                {
                    new()
                    {
                        Id = 1,
                        Sku = "SKU001",
                        Name = "Caçamba",
                        Unit = ProductUnit.Unit,
                        Price = 25.00M
                    },
                    new()
                    {
                        Id = 2,
                        Sku = "SKU002",
                        Name = "Descarte de Reciclagem",
                        Unit = ProductUnit.Kilogram,
                        Price = 2.00M
                    },
                    new()
                    {
                        Id = 3,
                        Sku = "SKU003",
                        Name = "Descarte de Rejeito",
                        Unit = ProductUnit.Gram,
                        Price = 1.00M
                    },
                };
        }

        [Fact]
        public void ProductService_Add_ShouldAddProductSuccessfully_WhenMethodIsCalledWithAValidObjectAndProductIsNotDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} cadastrado com sucesso."
            };

            _repository.Setup(_ => _.Add(It.IsAny<Product>()));
            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product>());

            // Act
            var result = _ProductService.Add(productMock);

            // Assert
            Assert.Equal(expectedResult.Data, productMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Product>()), Times.Once);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void ProductService_Add_ShouldNotAddProductAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Produto cadastrado com Nome {productMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product> { productMock });

            // Act
            var result = _ProductService.Add(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Product>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Once);
        }

        [Fact]
        public void ProductService_Add_ShouldNotAddProductAndReturnAnErrorMessage_WhenSkuIsDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Produto cadastrado com Sku {productMock.Sku}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product>())
                .Returns(new List<Product> { productMock });

            // Act
            var result = _ProductService.Add(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Add(It.IsAny<Product>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void ProductService_Update_ShouldUpdateProductSuccessfully_WhenMethodIsCalledWithAValidObjectAndProductIsNotDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };

            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} atualizado com sucesso."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product>());
            _repository.Setup(_ => _.Update(It.IsAny<Product>()));

            // Act
            var result = _ProductService.Update(productMock);

            // Assert
            Assert.Equal(expectedResult.Data, productMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductService_Update_ShouldNotUpdateProductAndReturnAnErrorMessage_WhenNameIsDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Produto cadastrado com Nome {productMock.Name}."
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product> { productMock });

            // Act
            var result = _ProductService.Update(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Product>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Once);
        }

        [Fact]
        public void ProductService_Update_ShouldNotUpdateProductAndReturnAnErrorMessage_WhenSkuIsDuplicated()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Já existe um Produto cadastrado com Sku {productMock.Sku}."
            };

            _repository.SetupSequence(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product>())
                .Returns(new List<Product> { productMock });

            // Act
            var result = _ProductService.Update(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Product>()), Times.Never);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Exactly(2));
        }

        [Fact]
        public void ProductService_Update_ShouldNotUpdateProductAndReturnAndErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível atualizar os dados do Produto {productMock.Name} na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(new List<Product>());
            _repository.Setup(_ => _.Update(It.IsAny<Product>()))
                .Throws(exception);

            // Act
            var result = _ProductService.Update(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Update(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductService_Remove_ShouldRemoveProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} removido com sucesso."
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Product>()));

            // Act
            var result = _ProductService.Remove(productMock);

            // Assert
            Assert.Equal(expectedResult.Data, productMock);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductService_Remove_ShouldNotRemoveProductAndReturnsAndError_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var productMock = new Product
            {
                Id = 1,
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível remover o Produto {productMock.Name} da base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Remove(It.IsAny<Product>()))
                .Throws(exception);

            // Act
            var result = _ProductService.Remove(productMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Remove(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductService_FindAll_ShouldReturnAListOfPeople_WhenDataTableHasRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Product>>
            {
                Data = _productListMock,
                Status = ResponseStatus.Success,
                Message = $"{_productListMock.Count} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(_productListMock);

            // Act
            var result = _ProductService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void ProductService_FindAll_ShouldReturnAnEmptyData_WhenDataTableHasNoRegisters()
        {
            // Arrange
            var expectedResult = new WebApiResponse<IEnumerable<Product>>
            {
                Data = new List<Product>(),
                Status = ResponseStatus.Success,
                Message = $"{0} registro(s) encontrado(s)."
            };

            _repository.Setup(_ => _.GetAll())
                .Returns(new List<Product>());

            // Act
            var result = _ProductService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void ProductService_FindAll_ShouldReturnAnEmptyListAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            var exception = new Exception();
            var expectedResult = new WebApiResponse<IEnumerable<Product>>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetAll())
                .Throws(exception);

            // Act
            var result = _ProductService.FindAll();

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetAll(), Times.Once);
        }

        [Fact]
        public void ProductService_FindById_ShouldReturnAnProductSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const int idMock = 1;
            var productMock = _productListMock.FirstOrDefault(_ => idMock.Equals(_.Id));
            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(productMock);

            // Act
            var result = _ProductService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void ProductService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenIdIsInvalid()
        {
            // Arrange
            const int idMock = 10;
            var expectedResult = new WebApiResponse<Product>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Produto com o ID {idMock} foi encontrado"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Returns(value: null);

            // Act
            var result = _ProductService.FindById(idMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void ProductService_FindById_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const int idMock = 1;
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.GetById(idMock))
                .Throws(exception);

            // Act
            var result = _ProductService.FindById(idMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.GetById(idMock), Times.Once);
        }

        [Fact]
        public void ProductService_FindBySku_ShouldReturnAnProductSuccessfully_WhenIdIsValid()
        {
            // Arrange
            const string skuMock = "SKU001";
            var productMock = _productListMock.Where(_ => skuMock.Equals(_.Sku)).ToList();
            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock.FirstOrDefault(),
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.FirstOrDefault().Name} encontrado com sucesso"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(productMock);

            // Act
            var result = _ProductService.FindBySku(skuMock);

            // Assert
            Assert.Equal(expectedResult.Data, result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Once);
        }

        [Fact]
        public void ProductService_FindBySku_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenSkuIsInvalid()
        {
            // Arrange
            const string skuMock = "SKU0010";
            var expectedResult = new WebApiResponse<Product>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Produto com Sku {skuMock} foi encontrado"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Returns(value: null);

            // Act
            var result = _ProductService.FindBySku(skuMock);

            // Assert
            Assert.Null(result.Data);
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Once);
        }

        [Fact]
        public void ProductService_FindBySku_ShouldReturnAnEmptyDataAndAnErrorMessage_WhenRepositoryGetsAnError()
        {
            // Arrange
            const string skuMock = "SKU0010";
            var exception = new Exception();
            var expectedResult = new WebApiResponse<Product>
            {
                Status = ResponseStatus.Error,
                Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {exception.Message}"
            };

            _repository.Setup(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()))
                .Throws(exception);

            // Act
            var result = _ProductService.FindBySku(skuMock);

            // Assert
            Assert.Equal(expectedResult.Status, result.Status);
            Assert.Equal(expectedResult.Message, result.Message);

            expectedResult.Should().BeEquivalentTo(result);
            _repository.Verify(_ => _.Query(It.IsAny<Expression<Func<Product, bool>>>()), Times.Once);
        }

    }
}
