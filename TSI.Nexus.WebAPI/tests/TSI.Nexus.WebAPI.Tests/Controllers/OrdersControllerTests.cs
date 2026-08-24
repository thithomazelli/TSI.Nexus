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
    public class OrdersControllerTests
    {
        private readonly OrdersController _controller;
        private readonly Mock<IOrderService> _orderServiceMock;
        private readonly IList<OrderDto> _ordersMock;

        public OrdersControllerTests()
        {
            _orderServiceMock = new Mock<IOrderService>();
            _controller = new OrdersController(_orderServiceMock.Object);

            _ordersMock = new List<OrderDto>
            {
                new OrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    OrderNumber = "ORD-001",
                    Description = "Pedido1",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new OrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    OrderNumber = "ORD-002",
                    Description = "Pedido2",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
            };
        }

        [Fact]
        public async Task GetAll_ShouldReturnOkWithData_WhenServiceReturnsOrders()
        {
            // Arrange
            var expected = new WebApiResponse<IEnumerable<OrderDto>>
            {
                Data = _ordersMock,
                Status = ResponseStatus.Success,
                Message = $"{_ordersMock.Count} registro(s) encontrado(s).",
            };

            _orderServiceMock.Setup(s => s.FindAll()).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<OrderDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _orderServiceMock.Verify(s => s.FindAll(), Times.Once);
        }

        [Fact]
        public async Task GetById_ShouldReturnOkWithOrder_WhenServiceReturnsOrder()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var order = _ordersMock.First(o => o.Id == id);
            var expected = new WebApiResponse<OrderDto>
            {
                Data = order,
                Status = ResponseStatus.Success,
                Message = $"Pedido {order.OrderNumber} encontrado com sucesso",
            };

            _orderServiceMock.Setup(s => s.FindById(id)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _orderServiceMock.Verify(s => s.FindById(id), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnOkWithCreatedOrder_WhenModelIsValid()
        {
            // Arrange
            var order = new OrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderNumber = "ORD-003",
                Description = "Novo Pedido",
                BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            };
            var expected = new WebApiResponse<OrderDto>
            {
                Data = order,
                Status = ResponseStatus.Success,
                Message = $"Pedido {order.OrderNumber} cadastrado com sucesso.",
            };

            _orderServiceMock.Setup(s => s.Add(order)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(order);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<OrderDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _orderServiceMock.Verify(s => s.Add(order), Times.Once);
        }
    }
}
