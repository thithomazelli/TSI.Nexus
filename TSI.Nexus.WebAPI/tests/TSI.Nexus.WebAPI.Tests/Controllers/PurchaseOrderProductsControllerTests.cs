using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class PurchaseOrderProductsControllerTests
    {
        private readonly PurchaseOrderProductsController _controller;
        private readonly Mock<IPurchaseOrderProductService> _serviceMock;

        public PurchaseOrderProductsControllerTests()
        {
            _serviceMock = new Mock<IPurchaseOrderProductService>();
            _controller = new PurchaseOrderProductsController(_serviceMock.Object);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_Add_ShouldAddPurchaseOrderProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderProductDto
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do pedido de compra cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<PurchaseOrderProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<PurchaseOrderProductDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_Add_ShouldNotAddPurchaseOrderProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderProductDto();
            _controller.ModelState.AddModelError("PurchaseOrderId", "PurchaseOrderId is required");

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("PurchaseOrderId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<PurchaseOrderProductDto>()), Times.Never);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_Update_ShouldUpdatePurchaseOrderProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderProductDto
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do pedido de compra atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<PurchaseOrderProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<PurchaseOrderProductDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_Update_ShouldNotUpdatePurchaseOrderProduct_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderProductDto();
            _controller.ModelState.AddModelError("PurchaseOrderId", "PurchaseOrderId is required");

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("PurchaseOrderId"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<PurchaseOrderProductDto>()), Times.Never);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_Remove_ShouldRemovePurchaseOrderProductSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderProductDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do pedido de compra removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<PurchaseOrderProductDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderProductDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<PurchaseOrderProductDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_GetAll_ShouldGetAllPurchaseOrderProducts_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<PurchaseOrderProductDto> { new() { Id = Guid.NewGuid() } };
            var expectedResult = new WebApiResponse<IEnumerable<PurchaseOrderProductDto>>
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
            var response = Assert.IsType<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_GetByPurchaseOrderId_ShouldGetPurchaseOrderProductsForPurchaseOrder_WhenMethodIsCalled()
        {
            // Arrange
            var purchaseOrderId = Guid.NewGuid();
            var listMock = new List<PurchaseOrderProductDto>
            {
                new() { Id = Guid.NewGuid(), PurchaseOrderId = purchaseOrderId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<PurchaseOrderProductDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByPurchaseOrderId(purchaseOrderId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByPurchaseOrderId(purchaseOrderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByPurchaseOrderId(purchaseOrderId), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_GetByProductId_ShouldGetPurchaseOrderProductsForProduct_WhenMethodIsCalled()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var listMock = new List<PurchaseOrderProductDto>
            {
                new() { Id = Guid.NewGuid(), ProductId = productId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<PurchaseOrderProductDto>>
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
            var response = Assert.IsType<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByProductId(productId), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductsController_GetById_ShouldGetPurchaseOrderProductById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var dtoMock = new PurchaseOrderProductDto { Id = idMock };
            var expectedResult = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Produto do pedido de compra encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderProductDto>>(okResult.Value);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }
    }
}
