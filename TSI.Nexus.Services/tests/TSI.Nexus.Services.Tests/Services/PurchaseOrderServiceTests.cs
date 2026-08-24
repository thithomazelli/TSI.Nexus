using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;

namespace TSI.Nexus.Services.Tests.Services
{
    public class PurchaseOrderServiceTests
    {
        private readonly PurchaseOrderService _purchaseOrderService;
        private readonly Mock<IRepository<PurchaseOrder>> _repository;
        private readonly Mock<ITransactionService> _transactionService;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly Mock<ICurrentUserService> _currentUserService;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logService;
        private readonly IList<PurchaseOrderDto> _purchaseOrderListMock;
        private readonly IMapper _mapper;

        public PurchaseOrderServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _repository = new Mock<IRepository<PurchaseOrder>>();
            _transactionService = new Mock<ITransactionService>();
            _sequenceService = new Mock<ISequenceService>();
            _currentUserService = new Mock<ICurrentUserService>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(true);
            _logService = new Mock<ILogService>();
            _mapper = config.CreateMapper();
            _purchaseOrderService = new PurchaseOrderService(
                _repository.Object,
                _transactionService.Object,
                _sequenceService.Object,
                _currentUserService.Object,
                _mapper,
                _featureToggleServiceMock.Object,
                _logService.Object
            );

            // Default: current user is Admin, so ownership checks are bypassed unless a test overrides this.
            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(true);

            // Default: no previous PurchaseOrder state found, so the ownership-by-id lookup is
            // safely skipped unless a test overrides this.
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<PurchaseOrder, bool>>>()))
                .ReturnsAsync(new List<PurchaseOrder>());

            _purchaseOrderListMock = new List<PurchaseOrderDto>
            {
                new PurchaseOrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    PurchaseOrderNumber = "FOR-00001",
                    Description = "Pedido de Compra Teste1",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    BusinessPartnerName = "FOR",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                },
                new PurchaseOrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    PurchaseOrderNumber = "PC-00002",
                    Description = "Pedido de Compra Teste2",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    BusinessPartnerName = "SUP",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                },
            };
        }

        [Fact]
        public async Task PurchaseOrderService_Add_ShouldAddPurchaseOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                PurchaseOrderNumber = "FOR-00001",
                Description = "Novo Pedido de Compra",
                BusinessPartnerName = "FOR",
                Transaction = new TransactionDto(),
            };

            var transactionDto = new TransactionDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                PurchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };

            _repository
                .Setup(r => r.AddAsync(It.IsAny<PurchaseOrder>()))
                .Returns(Task.CompletedTask);
            _transactionService
                .Setup(_ => _.Add(It.IsAny<TransactionDto>()))
                .ReturnsAsync(new WebApiResponse<TransactionDto> { Data = transactionDto });
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            var expected = new WebApiResponse<PurchaseOrderDto>
            {
                Data = new PurchaseOrderDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    PurchaseOrderNumber = "FOR-00001",
                    Description = "Novo Pedido de Compra",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                Status = ResponseStatus.Success,
                Message =
                    $"Pedido de Compra {purchaseOrderDto.PurchaseOrderNumber} cadastrado com sucesso.",
            };

            // Act
            var result = await _purchaseOrderService.Add(purchaseOrderDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<PurchaseOrder>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderService_Remove_ShouldRemovePurchaseOrderSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var purchaseOrderDto = _purchaseOrderListMock.First();
            var purchaseOrderEntity = _mapper.Map<PurchaseOrder>(_purchaseOrderListMock.First());

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        It.IsAny<Guid>(),
                        o => o.PurchaseOrderProducts,
                        p => p.Transaction
                    )
                )
                .ReturnsAsync(purchaseOrderEntity);
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<PurchaseOrder>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PurchaseOrderDto>
            {
                Data = purchaseOrderDto,
                Status = ResponseStatus.Success,
                Message =
                    $"Pedido de Compra {purchaseOrderDto.PurchaseOrderNumber} removido com sucesso.",
            };

            // Act
            var result = await _purchaseOrderService.Remove(purchaseOrderDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<PurchaseOrder>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderService_Remove_ShouldReturnWarningAndNotRemove_WhenPurchaseOrderBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var purchaseOrderDto = _purchaseOrderListMock.First();
            var purchaseOrderEntity = _mapper.Map<PurchaseOrder>(_purchaseOrderListMock.First());
            purchaseOrderEntity.CreateUserId = "owner-user-id";

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        It.IsAny<Guid>(),
                        o => o.PurchaseOrderProducts,
                        p => p.Transaction
                    )
                )
                .ReturnsAsync(purchaseOrderEntity);

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _purchaseOrderService.Remove(purchaseOrderDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<PurchaseOrder>()), Times.Never);
        }

        [Fact]
        public async Task PurchaseOrderService_FindById_ShouldReturnPurchaseOrder_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var purchaseOrderDto = _purchaseOrderListMock.First(o => o.Id == id);
            var purchaseOrderEntity = _mapper.Map<PurchaseOrder>(purchaseOrderDto);
            purchaseOrderEntity.BusinessPartner = new Individual { Name = "FOR" };

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.PurchaseOrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync(purchaseOrderEntity);

            var expected = new WebApiResponse<PurchaseOrderDto>
            {
                Data = purchaseOrderDto,
                Status = ResponseStatus.Success,
                Message =
                    $"Pedido de Compra {purchaseOrderDto.PurchaseOrderNumber} encontrado com sucesso",
            };

            // Act
            var result = await _purchaseOrderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
        }

        [Fact]
        public async Task PurchaseOrderService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000010");
            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        o => o.BusinessPartner,
                        op => op.PurchaseOrderProducts,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync((PurchaseOrder)null);

            var expected = new WebApiResponse<PurchaseOrderDto>
            {
                Data = null,
                Status = ResponseStatus.Success,
                Message = $"Nenhum Pedido de Compra com o ID {id} foi encontrado",
            };

            // Act
            var result = await _purchaseOrderService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
        }

        [Fact]
        public async Task PurchaseOrderService_FindAll_ShouldReturnPurchaseOrders_WhenDataExists()
        {
            // Arrange
            var purchaseOrdersMock = _mapper.Map<IList<PurchaseOrder>>(_purchaseOrderListMock);
            purchaseOrdersMock[0].BusinessPartner = new Individual { Name = "FOR" };
            purchaseOrdersMock[1].BusinessPartner = new Individual { Name = "SUP" };
            _repository
                .Setup(r =>
                    r.GetAllAsync(
                        o => o.BusinessPartner,
                        o => o.PurchaseOrderProducts,
                        t => t.Transaction,
                        p => p.Payments
                    )
                )
                .ReturnsAsync(purchaseOrdersMock);

            var expected = new WebApiResponse<IEnumerable<PurchaseOrderDto>>
            {
                Data = _purchaseOrderListMock,
                Status = ResponseStatus.Success,
                Message = $"{_purchaseOrderListMock.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _purchaseOrderService.FindAll();

            // Assert
            expected.Should().BeEquivalentTo(result);
        }

        [Fact]
        public async Task PurchaseOrderService_FindAll_ShouldReturnEmpty_WhenModuleToggleIsDisabled()
        {
            // Arrange
            _featureToggleServiceMock
                .Setup(_ =>
                    _.IsEnabledAsync(
                        FeatureToggleKeys.PurchaseOrder,
                        FeatureToggleKeys.PurchaseOrdersModule
                    )
                )
                .ReturnsAsync(false);

            // Act
            var result = await _purchaseOrderService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data);
            _repository.Verify(
                r =>
                    r.GetAllAsync(
                        It.IsAny<Expression<Func<PurchaseOrder, object>>>(),
                        It.IsAny<Expression<Func<PurchaseOrder, object>>>(),
                        It.IsAny<Expression<Func<PurchaseOrder, object>>>(),
                        It.IsAny<Expression<Func<PurchaseOrder, object>>>()
                    ),
                Times.Never
            );
        }

        [Fact]
        public async Task PurchaseOrderService_Update_ShouldReturnWarningAndNotUpdate_WhenPurchaseOrderBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var purchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = purchaseOrderId,
                PurchaseOrderNumber = "PC-00001",
                Transaction = new TransactionDto(),
            };

            var existingPurchaseOrder = new PurchaseOrder
            {
                Id = purchaseOrderId,
                CreateUserId = "owner-user-id",
            };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<PurchaseOrder, bool>>>()))
                .ReturnsAsync(new List<PurchaseOrder> { existingPurchaseOrder });

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _purchaseOrderService.Update(purchaseOrderDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<PurchaseOrder>()), Times.Never);
        }
    }
}
