using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
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
        public async Task GetByOrderId_ShouldReturnOkWithItems_WhenServiceReturnsItems()
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
        public async Task GetById_ShouldReturnOkWithItem_WhenServiceReturnsItem()
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
        public async Task Add_ShouldReturnOkWithCreatedItem_WhenModelIsValid()
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
        public async Task GetDelayed_ShouldReturnOkWithData_WhenServiceReturnsItems()
        {
            // Arrange
            var expected = new WebApiResponse<IEnumerable<OrderProductDto>>
            {
                Data = _itemsMock,
                Status = ResponseStatus.Success,
                Message = $"{_itemsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(s => s.FindDelayed()).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetDelayed();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<OrderProductDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindDelayed(), Times.Once);
        }
    }
}
