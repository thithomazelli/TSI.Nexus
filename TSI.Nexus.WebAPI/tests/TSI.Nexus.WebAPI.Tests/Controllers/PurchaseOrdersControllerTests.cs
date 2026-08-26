using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class PurchaseOrdersControllerTests
    {
        private readonly PurchaseOrdersController _controller;
        private readonly Mock<IPurchaseOrderService> _serviceMock;

        public PurchaseOrdersControllerTests()
        {
            _serviceMock = new Mock<IPurchaseOrderService>();
            _controller = new PurchaseOrdersController(_serviceMock.Object);
        }

        [Fact]
        public async Task PurchaseOrdersController_Add_ShouldAddPurchaseOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderDto
            {
                Id = Guid.NewGuid(),
                BusinessPartnerId = Guid.NewGuid(),
            };
            var expectedResult = new WebApiResponse<PurchaseOrderDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Pedido de compra cadastrado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<PurchaseOrderDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<PurchaseOrderDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrdersController_Add_ShouldNotAddPurchaseOrder_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderDto();
            _controller.ModelState.AddModelError(
                "BusinessPartnerId",
                "BusinessPartnerId is required"
            );

            // Act
            var result = await _controller.Add(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("BusinessPartnerId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<PurchaseOrderDto>()), Times.Never);
        }

        [Fact]
        public async Task PurchaseOrdersController_Update_ShouldUpdatePurchaseOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<PurchaseOrderDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Pedido de compra atualizado com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<PurchaseOrderDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<PurchaseOrderDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrdersController_Update_ShouldNotUpdatePurchaseOrder_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderDto();
            _controller.ModelState.AddModelError(
                "BusinessPartnerId",
                "BusinessPartnerId is required"
            );

            // Act
            var result = await _controller.Update(dtoMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("BusinessPartnerId"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<PurchaseOrderDto>()), Times.Never);
        }

        [Fact]
        public async Task PurchaseOrdersController_Remove_ShouldRemovePurchaseOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dtoMock = new PurchaseOrderDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<PurchaseOrderDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Pedido de compra removido com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<PurchaseOrderDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(dtoMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<PurchaseOrderDto>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrdersController_GetAll_ShouldGetAllPurchaseOrders_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<PurchaseOrderDto> { new() { Id = Guid.NewGuid() } };
            var expectedResult = new WebApiResponse<IEnumerable<PurchaseOrderDto>>
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
            var response = Assert.IsType<WebApiResponse<IEnumerable<PurchaseOrderDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrdersController_GetById_ShouldGetPurchaseOrderById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var dtoMock = new PurchaseOrderDto { Id = idMock };
            var expectedResult = new WebApiResponse<PurchaseOrderDto>
            {
                Data = dtoMock,
                Status = ResponseStatus.Success,
                Message = "Pedido de compra encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(idMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PurchaseOrderDto>>(okResult.Value);
            Assert.Equal(dtoMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(idMock), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrdersController_GetByBusinessPartnerId_ShouldGetPurchaseOrdersForBusinessPartner_WhenMethodIsCalled()
        {
            // Arrange
            var businessPartnerId = Guid.NewGuid();
            var listMock = new List<PurchaseOrderDto>
            {
                new() { Id = Guid.NewGuid(), BusinessPartnerId = businessPartnerId },
            };
            var expectedResult = new WebApiResponse<IEnumerable<PurchaseOrderDto>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByBusinessPartnerId(businessPartnerId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByBusinessPartnerId(businessPartnerId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<PurchaseOrderDto>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByBusinessPartnerId(businessPartnerId), Times.Once);
        }
    }
}
