using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class QuoteProductsControllerTests
    {
        private readonly QuoteProductsController _controller;
        private readonly Mock<IQuoteProductService> _serviceMock;

        public QuoteProductsControllerTests()
        {
            _serviceMock = new Mock<IQuoteProductService>();
            _controller = new QuoteProductsController(_serviceMock.Object);
        }

        [Fact]
        public async Task QuoteProductsController_Add_ShouldAddQuoteProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new QuoteProductDto { Id = Guid.NewGuid(), OrderId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do orçamento cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<QuoteProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<QuoteProductDto>()), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_Add_ShouldNotAddQuoteProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new QuoteProductDto();
            _controller.ModelState.AddModelError("OrderId", "OrderId is required");

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("OrderId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<QuoteProductDto>()), Times.Never);
        }

        [Fact]
        public async Task QuoteProductsController_Update_ShouldUpdateQuoteProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new QuoteProductDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do orçamento atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<QuoteProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<QuoteProductDto>()), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_Update_ShouldNotUpdateQuoteProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new QuoteProductDto();
            _controller.ModelState.AddModelError("OrderId", "OrderId is required");

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("OrderId"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<QuoteProductDto>()), Times.Never);
        }

        [Fact]
        public async Task QuoteProductsController_Remove_ShouldRemoveQuoteProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new QuoteProductDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do orçamento removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<QuoteProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<QuoteProductDto>()), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_GetAll_ShouldGetAllQuoteProducts_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<QuoteProductDto> { new() { Id = Guid.NewGuid() } };
            var expectedResult = new WebApiResponse<IEnumerable<QuoteProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<QuoteProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_GetByOrderId_ShouldGetQuoteProductsForOrder_WhenMethodIsCalled()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var listMock = new List<QuoteProductDto>
            {
                new() { Id = Guid.NewGuid(), OrderId = orderId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<QuoteProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByOrderId(orderId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByOrderId(orderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<QuoteProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByOrderId(orderId), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_GetByProductId_ShouldGetQuoteProductsForProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var listMock = new List<QuoteProductDto>
            {
                new() { Id = Guid.NewGuid(), ProductId = productId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<QuoteProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByProductId(productId)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByProductId(productId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<QuoteProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByProductId(productId), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_GetById_ShouldGetQuoteProductById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var dtoMock = new QuoteProductDto { Id = idMock };
            var expectedResult = new WebApiResponse<QuoteProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do orçamento encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteProductDto>>(okResult.Value);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }

        [Fact]
        public async Task QuoteProductsController_GetDelayed_ShouldGetDelayedQuoteProducts_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<QuoteProductDto> { new() { Id = Guid.NewGuid() } };
            var expectedResult = new WebApiResponse<IEnumerable<QuoteProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindDelayed()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetDelayed();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<QuoteProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindDelayed(), Times.Once);
        }
    }
}
