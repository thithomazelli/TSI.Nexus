using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;

namespace TSI.Friday.Services.Tests.Services
{
    public class OrderServiceTests
    {
        private readonly OrderService _orderService;
        private readonly Mock<IRepository<Order>> _repository;
        private readonly IList<Order> _orderListMock;
        private readonly IMapper _mapper;

        public OrderServiceTests()
        {
            _repository = new Mock<IRepository<Order>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _orderService = new OrderService(_repository.Object, _mapper);

            _orderListMock = new List<Order>
            {
                new Order
                {
                    Id =1,
                    OrderNumber = "ORD-001",
                    Description = "Pedido Teste1",
                    ClientId =1
                },
                new Order
                {
                    Id =2,
                    OrderNumber = "ORD-002",
                    Description = "Pedido Teste2",
                    ClientId =2
                }
            };
        }

        [Fact]
        public async Task OrderService_Add_ShouldAddOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var orderDto = new OrderDto { Id =3, OrderNumber = "ORD-003", Description = "Novo Pedido" };
            var orderEntity = _mapper.Map<Order>(orderDto);
            _repository.Setup(r => r.AddAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = orderDto,
                Status = ResponseStatus.Success,
                Message = $"Pedido {orderDto.OrderNumber} cadastrado com sucesso."
            };

            // Act
            var result = await _orderService.Add(orderDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Once);
        }

        [Fact]
        public async Task OrderService_Remove_ShouldRemoveOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var orderDto = _mapper.Map<OrderDto>(_orderListMock.First());
            var orderEntity = _mapper.Map<Order>(orderDto);
            _repository.Setup(r => r.RemoveAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = orderDto,
                Status = ResponseStatus.Success,
                Message = $"Pedido {orderDto.OrderNumber} removido com sucesso."
            };

            // Act
            var result = await _orderService.Remove(orderDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Order>()), Times.Once);
        }

        [Fact]
        public async Task OrderService_FindById_ShouldReturnOrder_WhenIdIsValid()
        {
            // Arrange
            const int id =1;
            var order = _orderListMock.First(o => o.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(order);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = _mapper.Map<OrderDto>(order),
                Status = ResponseStatus.Success,
                Message = $"Pedido {order.OrderNumber} encontrado com sucesso"
            };

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task OrderService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            const int id =10;
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Order)null);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Pedido com o ID {id} foi encontrado"
            };

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task OrderService_FindAll_ShouldReturnOrders_WhenDataExists()
        {
            // Arrange
            _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(_orderListMock);

            var expected = new WebApiResponse<IEnumerable<OrderDto>>
            {
                Data = _mapper.Map<IEnumerable<OrderDto>>(_orderListMock),
                Status = ResponseStatus.Success,
                Message = $"{_orderListMock.Count} registro(s) encontrado(s)."
            };

            // Act
            var result = await _orderService.FindAll();

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetAllAsync(), Times.Once);
        }
    }
}