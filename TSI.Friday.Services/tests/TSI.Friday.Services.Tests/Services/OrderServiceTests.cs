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
        private readonly Mock<IPaymentService> _paymentService;
        private readonly Mock<IProductService> _productService;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly IList<OrderDto> _orderListMock;
        private readonly IMapper _mapper;

        public OrderServiceTests()
        {
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _repository = new Mock<IRepository<Order>>();
            _paymentService = new Mock<IPaymentService>();
            _productService = new Mock<IProductService>();
            _sequenceService = new Mock<ISequenceService>();
            _mapper = config.CreateMapper();
            _orderService = new OrderService(
                _repository.Object,
                _paymentService.Object,
                _productService.Object,
                _sequenceService.Object,
                _mapper
            );

            _orderListMock = new List<OrderDto>
            {
                new OrderDto
                {
                    Id = 1,
                    OrderNumber = "ORD-00001",
                    Description = "Pedido Teste1",
                    BusinessPartnerId = 1,
                    BusinessPartnerName = "ORD",
                },
                new OrderDto
                {
                    Id = 2,
                    OrderNumber = "THG-00002",
                    Description = "Pedido Teste2",
                    BusinessPartnerId = 2,
                    BusinessPartnerName = "THG",
                },
            };
        }

        [Fact]
        public async Task OrderService_Add_ShouldAddOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var orderDto = new OrderDto
            {
                Id = 3,
                OrderNumber = "ORD-00001",
                Description = "Novo Pedido",
                BusinessPartnerName = "ORD",
                Payment = new PaymentDto(),
            };

            _repository.Setup(r => r.AddAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);
            _paymentService.Setup(_ => _.Add(It.IsAny<PaymentDto>()));
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = new OrderDto
                {
                    Id = 3,
                    OrderNumber = "ORD-00001",
                    Description = "Novo Pedido",
                },
                Status = ResponseStatus.Success,
                Message = $"Pedido {orderDto.OrderNumber} cadastrado com sucesso.",
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
            var orderDto = _orderListMock.First();
            var orderEntity = _mapper.Map<Order>(_orderListMock.First());

            _repository
                .Setup(r => r.GetByIdAsync(It.IsAny<int>(), o => o.OrderProducts))
                .ReturnsAsync(orderEntity);
            _repository.Setup(r => r.RemoveAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = orderDto,
                Status = ResponseStatus.Success,
                Message = $"Pedido {orderDto.OrderNumber} removido com sucesso.",
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
            const int id = 1;
            var orderDto = _orderListMock.First(o => o.Id == id);
            var orderEntity = _mapper.Map<Order>(orderDto);
            orderEntity.BusinessPartner = new Individual { Name = "ORD" };

            _repository
                .Setup(r => r.GetByIdAsync(id, o => o.BusinessPartner))
                .ReturnsAsync(orderEntity);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = orderDto,
                Status = ResponseStatus.Success,
                Message = $"Pedido {orderDto.OrderNumber} encontrado com sucesso",
            };

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id, o => o.BusinessPartner), Times.Once);
        }

        [Fact]
        public async Task OrderService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            const int id = 10;
            _repository
                .Setup(r => r.GetByIdAsync(id, o => o.BusinessPartner))
                .ReturnsAsync((Order)null);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Pedido com o ID {id} foi encontrado",
            };

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id, o => o.BusinessPartner), Times.Once);
        }

        [Fact]
        public async Task OrderService_FindAll_ShouldReturnOrders_WhenDataExists()
        {
            // Arrange
            var ordersMock = _mapper.Map<IList<Order>>(_orderListMock);
            ordersMock[0].BusinessPartner = new Individual { Name = "ORD" };
            ordersMock[1].BusinessPartner = new Individual { Name = "THG" };
            _repository.Setup(r => r.GetAllAsync(o => o.BusinessPartner)).ReturnsAsync(ordersMock);

            var expected = new WebApiResponse<IEnumerable<OrderDto>>
            {
                Data = _orderListMock,
                Status = ResponseStatus.Success,
                Message = $"{_orderListMock.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _orderService.FindAll();

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetAllAsync(o => o.BusinessPartner), Times.Once);
        }
    }
}
