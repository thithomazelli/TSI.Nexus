using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class ProductPhotosControllerTests
    {
        private readonly ProductPhotosController _productPhotosController;
        private readonly Mock<IProductPhotoService> _productPhotoServiceMock;

        public ProductPhotosControllerTests()
        {
            _productPhotoServiceMock = new Mock<IProductPhotoService>();
            _productPhotosController = new ProductPhotosController(_productPhotoServiceMock.Object);
        }

        [Fact]
        public async Task ProductPhotosController_Add_ShouldAddProductPhotoSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productPhotoMock = new ProductPhoto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                FileName = "Photo001.jpg",
                IsDefault = true,
            };

            var expectedResult = new WebApiResponse<ProductPhoto>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"Imagem {productPhotoMock.FileName} cadastrada com sucesso.",
            };

            _productPhotoServiceMock
                .Setup(_ => _.Add(It.IsAny<ProductPhoto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.Add(productPhotoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ProductPhoto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(_ => _.Add(It.IsAny<ProductPhoto>()), Times.Once);
        }

        [Fact]
        public async Task ProductPhotosController_Add_ShouldNotAddProductPhotoSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productPhotoMock = new ProductPhoto();

            _productPhotosController.ModelState.AddModelError("FileName", "FileName is required");

            _productPhotoServiceMock.Setup(_ => _.Add(It.IsAny<ProductPhoto>()));

            // Act
            var result = await _productPhotosController.Add(productPhotoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("FileName"));

            _productPhotoServiceMock.Verify(_ => _.Add(It.IsAny<ProductPhoto>()), Times.Never);
        }

        [Fact]
        public async Task ProductPhotosController_Update_ShouldUpdateProductPhotoSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productPhotoMock = new ProductPhoto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                FileName = "Photo001.jpg",
                IsDefault = true,
            };

            var expectedResult = new WebApiResponse<ProductPhoto>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"Imagem {productPhotoMock.FileName} atualizada com sucesso.",
            };

            _productPhotoServiceMock
                .Setup(_ => _.Update(It.IsAny<ProductPhoto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.Update(productPhotoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ProductPhoto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(_ => _.Update(It.IsAny<ProductPhoto>()), Times.Once);
        }

        [Fact]
        public async Task ProductPhotosController_Update_ShouldNotUpdateProductPhotoSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var productPhotoMock = new ProductPhoto();

            _productPhotosController.ModelState.AddModelError("FileName", "FileName is duplicated");

            _productPhotoServiceMock.Setup(_ => _.Update(It.IsAny<ProductPhoto>()));

            // Act
            var result = await _productPhotosController.Update(productPhotoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("FileName"));

            _productPhotoServiceMock.Verify(_ => _.Update(It.IsAny<ProductPhoto>()), Times.Never);
        }

        [Fact]
        public async Task ProductPhotosController_Remove_ShouldRemoveProductPhotoSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var productPhotoMock = new ProductPhoto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                FileName = "Photo001.jpg",
                IsDefault = true,
            };

            var expectedResult = new WebApiResponse<ProductPhoto>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"Imagem {productPhotoMock.FileName} removida com sucesso.",
            };

            _productPhotoServiceMock
                .Setup(_ => _.Remove(It.IsAny<ProductPhoto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.Remove(productPhotoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ProductPhoto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(_ => _.Remove(It.IsAny<ProductPhoto>()), Times.Once);
        }

        [Fact]
        public async Task ProductPhotosController_GetById_ShouldGetProductPhotoById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var productPhotoMock = new ProductPhoto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                FileName = "Photo001.jpg",
                IsDefault = true,
            };

            var expectedResult = new WebApiResponse<ProductPhoto>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"Imagem {productPhotoMock.FileName} encontrada com sucesso",
            };

            _productPhotoServiceMock
                .Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ProductPhoto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task ProductPhotosController_GetDefaultByProduct_ShouldGetProductPhotoDefaultByProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var productPhotoMock = new ProductPhoto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                ProductId = productId,
                FileName = "Photo001.jpg",
                IsDefault = true,
            };

            var expectedResult = new WebApiResponse<ProductPhoto>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"Imagem {productPhotoMock.FileName} encontrada com sucesso",
            };

            _productPhotoServiceMock
                .Setup(_ => _.FindDefaultByProduct(It.IsAny<Guid>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.GetDefaultByProduct(productId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<ProductPhoto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(
                _ => _.FindDefaultByProduct(It.IsAny<Guid>()),
                Times.Once
            );
        }

        [Fact]
        public async Task ProductPhotosController_GetAlllByProduct_ShouldGetAlllProductPhotosByProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var productPhotoMock = new List<ProductPhoto>
            {
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = productId,
                    FileName = "Photo001.jpg",
                    IsDefault = true,
                },
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    ProductId = productId,
                    FileName = "Photo002.jpg",
                    IsDefault = false,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<ProductPhoto>>
            {
                Data = productPhotoMock,
                Status = ResponseStatus.Success,
                Message = $"{productPhotoMock.Count()} registro(s) encontrado(s).",
            };

            _productPhotoServiceMock
                .Setup(_ => _.FindAllByProduct(productId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _productPhotosController.GetAlllByProduct(productId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<ProductPhoto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(productPhotoMock, response.Data);

            _productPhotoServiceMock.Verify(_ => _.FindAllByProduct(It.IsAny<Guid>()), Times.Once);
        }
    }
}
