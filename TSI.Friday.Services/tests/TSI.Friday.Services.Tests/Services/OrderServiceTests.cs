using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging;
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
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<ITransactionService> _transactionService;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly Mock<ICurrentUserService> _currentUserService;
        private readonly Mock<IServiceOrderService> _serviceOrderService;
        private readonly Mock<ILogService> _logService;
        private readonly IList<OrderDto> _orderListMock;
        private readonly IMapper _mapper;

        public OrderServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _repository = new Mock<IRepository<Order>>();
            _orderProductRepository = new Mock<IRepository<OrderProduct>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _transactionService = new Mock<ITransactionService>();
            _sequenceService = new Mock<ISequenceService>();
            _currentUserService = new Mock<ICurrentUserService>();
            _serviceOrderService = new Mock<IServiceOrderService>();
            _logService = new Mock<ILogService>();
            _mapper = config.CreateMapper();
            _orderService = new OrderService(
                _repository.Object,
                _orderProductRepository.Object,
                _vehicleRepository.Object,
                _transactionService.Object,
                _sequenceService.Object,
                _currentUserService.Object,
                _serviceOrderService.Object,
                _mapper,
                _logService.Object
            );

            // Default: current user is Admin, so ownership checks are bypassed unless a test overrides this.
            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(true);

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle>());

            // Default: no previous Order state found, so the Closed-transition commission trigger
            // and the ownership-by-id lookup are both safely skipped unless a test overrides this.
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(new List<Order>());

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
                    QuoteNumber = string.Empty,
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
                    QuoteNumber = string.Empty,
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
                QuoteNumber = string.Empty,
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
                    QuoteNumber = string.Empty,
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
        public async Task OrderService_Add_ShouldReturnWarningAndNotAddOrder_WhenVehicleIsBlocked()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000099");
            var orderDto = new OrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderNumber = "ORD-00001",
                Description = "Novo Pedido",
                BusinessPartnerName = "ORD",
                VehicleId = vehicleId,
                Transaction = new TransactionDto(),
                QuoteNumber = string.Empty,
            };

            var blockedVehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Blocked,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { blockedVehicle });

            // Act
            var result = await _orderService.Add(orderDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            Assert.Equal(
                $"O veículo {blockedVehicle.Plate} está bloqueado por manutenção vencida e não pode ser vinculado a uma viagem.",
                result.Message
            );
            _repository.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Never);
        }

        [Fact]
        public async Task OrderService_Add_ShouldCalculatePriceFromVehicleRates_WhenDistanceAndDailyCountAreInformed()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000098");
            var orderDto = new OrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderNumber = "ORD-00001",
                Description = "Novo Pedido",
                BusinessPartnerName = "ORD",
                VehicleId = vehicleId,
                DistanceKm = 100,
                DailyCount = 2,
                Transaction = new TransactionDto(),
                QuoteNumber = string.Empty,
            };

            var availableVehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Available,
                PricePerKm = 5.00M,
                DailyRate = 300.00M,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { availableVehicle });

            Order capturedOrder = null;
            _repository
                .Setup(r => r.AddAsync(It.IsAny<Order>()))
                .Callback<Order>(o => capturedOrder = o)
                .Returns(Task.CompletedTask);
            _transactionService
                .Setup(_ => _.Add(It.IsAny<TransactionDto>()))
                .ReturnsAsync(
                    new WebApiResponse<TransactionDto> { Data = new TransactionDto { Id = Guid.NewGuid() } }
                );
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            // Act
            var result = await _orderService.Add(orderDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(capturedOrder);
            // 100km * 5.00 + 2 daily * 300.00 = 500 + 600 = 1100
            Assert.Equal(1100.00M, capturedOrder.Price);
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
        public async Task OrderService_Remove_ShouldReturnWarningAndNotRemove_WhenOrderBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var orderDto = _orderListMock.First();
            var orderEntity = _mapper.Map<Order>(_orderListMock.First());
            orderEntity.CreateUserId = "owner-user-id";

            _repository
                .Setup(r =>
                    r.GetByIdAsync(It.IsAny<Guid>(), o => o.OrderProducts, p => p.Transaction)
                )
                .ReturnsAsync(orderEntity);

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _orderService.Remove(orderDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Order>()), Times.Never);
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
        public async Task OrderService_FindById_ShouldReturnWarning_WhenOrderBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var orderDto = _orderListMock.First(o => o.Id == id);
            var orderEntity = _mapper.Map<Order>(orderDto);
            orderEntity.CreateUserId = "owner-user-id";

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

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            Assert.Null(result.Data);
        }

        [Fact]
        public async Task OrderService_FindById_ShouldReturnOrder_WhenOrderBelongsToCurrentUser()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var orderDto = _orderListMock.First(o => o.Id == id);
            var orderEntity = _mapper.Map<Order>(orderDto);
            orderEntity.CreateUserId = "owner-user-id";
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

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("owner-user-id");

            // Act
            var result = await _orderService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(result.Data);
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

        [Fact]
        public async Task OrderService_Update_ShouldGenerateServiceOrder_WhenOrderTransitionsToClosedWithDriverAssigned()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverId = Guid.Parse("00000000-0000-0000-0000-000000000077");
            var orderDto = new OrderDto
            {
                Id = orderId,
                OrderNumber = "ORD-00001",
                Status = OrderStatus.Closed,
                DriverId = driverId,
                Transaction = new TransactionDto(),
            };

            var previousOrder = new Order
            {
                Id = orderId,
                Status = OrderStatus.Open,
                DriverId = driverId,
            };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(new List<Order> { previousOrder });

            // Act
            await _orderService.Update(orderDto);

            // Assert
            _serviceOrderService.Verify(
                _ => _.GenerateForOrder(It.Is<Order>(o => o.Id == orderId)),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderService_Update_ShouldNotGenerateServiceOrder_WhenOrderWasAlreadyClosed()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverId = Guid.Parse("00000000-0000-0000-0000-000000000077");
            var orderDto = new OrderDto
            {
                Id = orderId,
                OrderNumber = "ORD-00001",
                Status = OrderStatus.Closed,
                DriverId = driverId,
                Transaction = new TransactionDto(),
            };

            var previousOrder = new Order
            {
                Id = orderId,
                Status = OrderStatus.Closed,
                DriverId = driverId,
            };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(new List<Order> { previousOrder });

            // Act
            await _orderService.Update(orderDto);

            // Assert
            _serviceOrderService.Verify(
                _ => _.GenerateForOrder(It.IsAny<Order>()),
                Times.Never
            );
        }

        [Fact]
        public async Task OrderService_Update_ShouldReturnWarningAndNotUpdate_WhenOrderBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var orderDto = new OrderDto
            {
                Id = orderId,
                OrderNumber = "ORD-00001",
                Transaction = new TransactionDto(),
            };

            var existingOrder = new Order { Id = orderId, CreateUserId = "owner-user-id" };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(new List<Order> { existingOrder });

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _orderService.Update(orderDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Order>()), Times.Never);
        }
    }
}
