using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class ProductControllerTests
    {
        private readonly ProductController _productController;
        private readonly Mock<IProductService> _productServiceMock;

        public ProductControllerTests()
        {
            _productServiceMock = new Mock<IProductService>();
            _productController = new ProductController(_productServiceMock.Object);
        }

        [Fact]
        public void ProductController_Add_ShouldAddProductSuccessfully_WhenMethodIsCalledWithAValidObject()
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

            _productServiceMock.Setup(_ => _.Add(It.IsAny<Product>()))
                .Returns(expectedResult);

            // Act
            var result = _productController.Add(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Add(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductController_Add_ShouldNotAddProductSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productMock = new Product();

            _productController.ModelState.AddModelError("Name", "Name is required");

            _productServiceMock.Setup(_ => _.Add(It.IsAny<Product>()));

            // Act
            var result = _productController.Add(productMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _productServiceMock.Verify(_ => _.Add(It.IsAny<Product>()), Times.Never);
        }

        [Fact]
        public void ProductController_Update_ShouldUpdateProductSuccessfully_WhenMethodIsCalledWithAValidObject()
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

            _productServiceMock.Setup(_ => _.Update(It.IsAny<Product>()))
                .Returns(expectedResult);

            // Act
            var result = _productController.Update(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Update(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductController_Update_ShouldNotUpdateProductSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productMock = new Product();

            _productController.ModelState.AddModelError("Name", "Name is duplicated");

            _productServiceMock.Setup(_ => _.Update(It.IsAny<Product>()));

            // Act
            var result = _productController.Update(productMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _productServiceMock.Verify(_ => _.Update(It.IsAny<Product>()), Times.Never);
        }

        [Fact]
        public void ProductController_Remove_ShouldRemoveProductSuccessfully_WhenMethodIsCalledWithAValidObject()
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

            _productServiceMock.Setup(_ => _.Remove(It.IsAny<Product>()))
                .Returns(expectedResult);

            // Act
            var result = _productController.Remove(productMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.Remove(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public void ProductController_GetAll_ShouldGetAllProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productMock = new List<Product>
            {
                new() {
                    Id = 1,
                    Sku = "SKU001",
                    Name = "Caçamba",
                    Unit = ProductUnit.Unit,
                    Price = 25.00M
                },
                new() {
                    Id = 2,
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
                .Returns(expectedResult);

            // Act
            var result = _productController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<Product>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public void ProductController_GetById_ShouldGetProductById_WhenMethodIsCalled()
        {
            // Arrange
            const int idMock = 1;
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
                Message = $"Produto {productMock.Name} encontrado com sucesso"
            };

            _productServiceMock.Setup(_ => _.FindById(It.IsAny<int?>()))
                .Returns(expectedResult);

            // Act
            var result = _productController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindById(It.IsAny<int?>()), Times.Once);
        }

        [Fact]
        public void ProductController_GetBySku_ShouldGetProductBySku_WhenMethodIsCalled()
        {
            // Arrange
            var skuMock = "SKU001";
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
                Message = $"Produto {productMock.Name} encontrado com sucesso"
            };

            _productServiceMock.Setup(_ => _.FindBySku(It.IsAny<string>()))
                .Returns(expectedResult);

            // Act
            var result = _productController.GetBySku(skuMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<Product>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productMock, response.Data);

            _productServiceMock.Verify(_ => _.FindBySku(It.IsAny<string>()), Times.Once);
        }
    }

}
