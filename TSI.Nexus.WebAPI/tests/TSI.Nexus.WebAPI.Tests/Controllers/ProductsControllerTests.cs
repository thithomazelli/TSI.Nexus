using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class ProductsControllerTests
    {
        private readonly ProductsController _productsController;
        private readonly Mock<IProductService> _productServiceMock;

        public ProductsControllerTests()
        {
            _productServiceMock = new Mock<IProductService>();
            _productsController = new ProductsController(_productServiceMock.Object);
        }

        [Fact]
        public async Task ProductsController_Add_ShouldAddProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productMock = new Product
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
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

            _productServiceMock.Setup(_ => _.Add(It.IsAny<Product>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.Add(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Add(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public async Task ProductsController_Add_ShouldNotAddProductSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productMock = new Product();

            _productsController.ModelState.AddModelError("Name", "Name is required");

            _productServiceMock.Setup(_ => _.Add(It.IsAny<Product>()));

            // Act
            var result = await _productsController.Add(productMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _productServiceMock.Verify(_ => _.Add(It.IsAny<Product>()), Times.Never);
        }

        [Fact]
        public async Task ProductsController_Update_ShouldUpdateProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productMock = new Product
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
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

            _productServiceMock.Setup(_ => _.Update(It.IsAny<Product>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.Update(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Update(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public async Task ProductsController_Update_ShouldNotUpdateProductSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productMock = new Product();

            _productsController.ModelState.AddModelError("Name", "Name is duplicated");

            _productServiceMock.Setup(_ => _.Update(It.IsAny<Product>()));

            // Act
            var result = await _productsController.Update(productMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _productServiceMock.Verify(_ => _.Update(It.IsAny<Product>()), Times.Never);
        }

        [Fact]
        public async Task ProductsController_Remove_ShouldRemoveProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productMock = new Product
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
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

            _productServiceMock.Setup(_ => _.Remove(It.IsAny<Product>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.Remove(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Remove(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public async Task ProductsController_GetAll_ShouldGetAllProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productMock = new List<Product>
            {
                new() {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Sku = "SKU001",
                    Name = "Caçamba",
                    Unit = ProductUnit.Unit,
                    Price = 25.00M
                },
                new() {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Sku = "SKU002",
                    Name = "Descarte de Reciclagem",
                    Unit = ProductUnit.Kilogram,
                    Price = 2.00M
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<Product>>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"{productMock.Count()} registro(s) encontrado(s)."
            };

            _productServiceMock.Setup(_ => _.FindAll())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Product>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task ProductsController_GetById_ShouldGetProductById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var productMock = new Product
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };

            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} encontrado com sucesso"
            };

            _productServiceMock.Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task ProductsController_GetBySku_ShouldGetProductBySku_WhenMethodIsCalled()
        {
            // Arrange
            var skuMock = "SKU001";
            var productMock = new Product
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Sku = "SKU001",
                Name = "Caçamba",
                Unit = ProductUnit.Unit,
                Price = 25.00M
            };

            var expectedResult = new WebApiResponse<Product>
            {
                Data = productMock,
                Status = ResponseStatus.Success,
                Message = $"Produto {productMock.Name} encontrado com sucesso"
            };

            _productServiceMock.Setup(_ => _.FindBySku(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productsController.GetBySku(skuMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindBySku(It.IsAny<string>()), Times.Once);
        }
    }
}
