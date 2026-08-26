using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class OrderProductsControllerTests
    {
        private readonly OrderProductsController _controller;
        private readonly Mock<IOrderProductService> _serviceMock;
        private readonly IList<OrderProductDto> _itemsMock;

        public OrderProductsControllerTests()
        {
            _serviceMock = new Mock<IOrderProductService>();
            _controller = new OrderProductsController(_serviceMock.Object);

            _itemsMock = new List<OrderProductDto>
            {
                new OrderProductDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Item1",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new OrderProductDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Item 2",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
            };
        }

        [Fact]
        public async Task OrderProductsController_GetByOrderId_ShouldReturnOkWithItems_WhenServiceReturnsItems()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.OrderId == orderId).ToList();
            var expected = new WebApiResponse<IEnumerable<OrderProductDto>>
            {
                Data = items,
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(s => s.FindByOrderId(orderId)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByOrderId(orderId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<OrderProductDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindByOrderId(orderId), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_GetByProductId_ShouldReturnOkWithItems_WhenServiceReturnsItems()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.ProductId == productId).ToList();
            var expected = new WebApiResponse<IEnumerable<OrderProductDto>>
            {
                Data = items,
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(s => s.FindByProductId(productId)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByProductId(productId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<OrderProductDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindByProductId(productId), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_GetById_ShouldReturnOkWithItem_WhenServiceReturnsItem()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var item = _itemsMock.First(i => i.Id == id);
            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = item,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} encontrado com sucesso",
            };

            _serviceMock.Setup(s => s.FindById(id)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderProductDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindById(id), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_Add_ShouldReturnOkWithCreatedItem_WhenModelIsValid()
        {
            // Arrange
            var item = new OrderProductDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Item 3",
                OrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = item,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} cadastrado com sucesso.",
            };

            _serviceMock.Setup(s => s.Add(item)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(item);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderProductDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.Add(item), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_Add_ShouldReturnBadRequest_WhenModelIsInvalid()
        {
            // Arrange
            var item = new OrderProductDto();
            _controller.ModelState.AddModelError("OrderId", "OrderId is required");

            // Act
            var result = await _controller.Add(item);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("OrderId"));

            _serviceMock.Verify(s => s.Add(It.IsAny<OrderProductDto>()), Times.Never);
        }

        [Fact]
        public async Task OrderProductsController_Update_ShouldReturnOkWithUpdatedItem_WhenModelIsValid()
        {
            // Arrange
            var item = _itemsMock.First();
            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = item,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} atualizado com sucesso.",
            };

            _serviceMock.Setup(s => s.Update(item)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Update(item);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderProductDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.Update(item), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_Update_ShouldReturnBadRequest_WhenModelIsInvalid()
        {
            // Arrange
            var item = new OrderProductDto();
            _controller.ModelState.AddModelError("OrderId", "OrderId is required");

            // Act
            var result = await _controller.Update(item);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("OrderId"));

            _serviceMock.Verify(s => s.Update(It.IsAny<OrderProductDto>()), Times.Never);
        }

        [Fact]
        public async Task OrderProductsController_Remove_ShouldReturnOkWithRemovedItem_WhenMethodIsCalled()
        {
            // Arrange
            var item = _itemsMock.First();
            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = item,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} removido com sucesso.",
            };

            _serviceMock.Setup(s => s.Remove(item)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Remove(item);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderProductDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.Remove(item), Times.Once);
        }

        [Fact]
        public async Task OrderProductsController_GetAll_ShouldReturnOkWithItems_WhenServiceReturnsItems()
        {
            // Arrange
            var expected = new WebApiResponse<IEnumerable<OrderProductDto>>
            {
                Data = _itemsMock,
                Status = ResponseStatus.Success,
                Message = $"{_itemsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(s => s.FindAll()).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<OrderProductDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindAll(), Times.Once);
        }
    }
}
