using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
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
        private readonly Mock<IRepository<OrderProduct>> _orderProductRepository;
        private readonly Mock<ITransactionService> _transactionService;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly IList<OrderDto> _orderListMock;
        private readonly IMapper _mapper;

        public OrderServiceTests()
        {
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _repository = new Mock<IRepository<Order>>();
            _orderProductRepository = new Mock<IRepository<OrderProduct>>();
            _transactionService = new Mock<ITransactionService>();
            _sequenceService = new Mock<ISequenceService>();
            _mapper = config.CreateMapper();
            _orderService = new OrderService(
                _repository.Object,
                _orderProductRepository.Object,
                _transactionService.Object,
                _sequenceService.Object,
                _mapper
            );

            _orderListMock = new List<OrderDto>
            {
                new OrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    OrderNumber = "ORD-00001",
                    Description = "Pedido Teste1",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    BusinessPartnerName = "ORD",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                },
                new OrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    OrderNumber = "THG-00002",
                    Description = "Pedido Teste2",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    BusinessPartnerName = "THG",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                },
            };
        }

        [Fact]
        public async Task OrderService_Add_ShouldAddOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var orderDto = new OrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderNumber = "ORD-00001",
                Description = "Novo Pedido",
                BusinessPartnerName = "ORD",
                Transaction = new TransactionDto(),
            };

            var transactionDto = new TransactionDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                OrderId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };

            _repository.Setup(r => r.AddAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);
            _transactionService
                .Setup(_ => _.Add(It.IsAny<TransactionDto>()))
                .ReturnsAsync(new WebApiResponse<TransactionDto> { Data = transactionDto });
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            var expected = new WebApiResponse<OrderDto>
            {
                Data = new OrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    OrderNumber = "ORD-00001",
                    Description = "Novo Pedido",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
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
                .Setup(r =>
                    r.GetByIdAsync(It.IsAny<Guid>(), o => o.OrderProducts, p => p.Transaction)
                )
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
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var orderDto = _orderListMock.First(o => o.Id == id);
            var orderEntity = _mapper.Map<Order>(orderDto);
            orderEntity.BusinessPartner = new Individual { Name = "ORD" };

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.OrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
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
            _repository.Verify(
                r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.OrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000010");
            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.OrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
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
            _repository.Verify(
                r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.OrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderService_FindAll_ShouldReturnOrders_WhenDataExists()
        {
            // Arrange
            var ordersMock = _mapper.Map<IList<Order>>(_orderListMock);
            ordersMock[0].BusinessPartner = new Individual { Name = "ORD" };
            ordersMock[1].BusinessPartner = new Individual { Name = "THG" };
            _repository
                .Setup(r =>
                    r.GetAllAsync(
                        o => o.BusinessPartner,
                        o => o.OrderProducts,
                        t => t.Transaction,
                        p => p.Payments
                    )
                )
                .ReturnsAsync(ordersMock);

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
            _repository.Verify(
                r =>
                    r.GetAllAsync(
                        o => o.BusinessPartner,
                        o => o.OrderProducts,
                        t => t.Transaction,
                        p => p.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderService_Update_WhenMarkAllProductsAsReturned_CallsExecuteUpdate()
        {
            // Arrange
            var orderDto = new OrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                OrderNumber = "ORD-00001",
                MarkAllProductsAsReturned = true,
                Transaction = new TransactionDto(),
            };

            _repository.Setup(r => r.UpdateAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);
            _transactionService
                .Setup(t => t.Update(It.IsAny<TransactionDto>()))
                .ReturnsAsync(
                    new WebApiResponse<TransactionDto>
                    {
                        Status = ResponseStatus.Success,
                        Data = orderDto.Transaction,
                    }
                );
            _orderProductRepository
                .Setup(r =>
                    r.ExecuteUpdateAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        It.IsAny<Action<OrderProduct>>()
                    )
                )
                .ReturnsAsync(1);

            // Act
            var result = await _orderService.Update(orderDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            _orderProductRepository.Verify(
                r =>
                    r.ExecuteUpdateAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        It.IsAny<Action<OrderProduct>>()
                    ),
                Times.Once
            );
        }
    }
}
