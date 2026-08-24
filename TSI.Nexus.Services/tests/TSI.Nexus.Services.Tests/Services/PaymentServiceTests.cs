using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;
using Microsoft.Extensions.Logging;

namespace TSI.Nexus.Services.Tests.Services
{
    public class PaymentServiceTests
    {
        private readonly PaymentService _paymentService;
        private readonly Mock<IRepository<Payment>> _repository;
        private readonly Mock<ILogService> _logService;
        private readonly IList<Payment> _paymentsMock;
        private readonly IMapper _mapper;

        public PaymentServiceTests()
        {
            _repository = new Mock<IRepository<Payment>>();
            _logService = new Mock<ILogService>();
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _mapper = config.CreateMapper();
            _paymentService = new PaymentService(_repository.Object, _mapper, _logService.Object);

            _paymentsMock = new List<Payment>
            {
                new Payment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Transação1",
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new Payment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Transação2",
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
            };
        }

        [Fact]
        public async Task PaymentService_Add_ShouldAddPaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = new PaymentDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Transação3",
                TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
            _repository.Setup(r => r.AddAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} cadastrada com sucesso.",
            };

            // Act
            var result = await _paymentService.Add(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_Update_ShouldUpdatePaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _mapper.Map<PaymentDto>(_paymentsMock.First());
            _repository.Setup(r => r.UpdateAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} atualizada com sucesso.",
            };

            // Act
            var result = await _paymentService.Update(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_Remove_ShouldRemovePaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _mapper.Map<PaymentDto>(_paymentsMock.First());
            _repository.Setup(r => r.RemoveAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} removida com sucesso.",
            };

            // Act
            var result = await _paymentService.Remove(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindById_ShouldReturnPayment_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transaction = _paymentsMock.First(p => p.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(transaction);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = _mapper.Map<PaymentDto>(transaction),
                Status = ResponseStatus.Success,
                Message = $"Pagamento {transaction.Description} encontrada com sucesso",
            };

            // Act
            var result = await _paymentService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindByTransactionId_ShouldReturnPayments_WhenTransactionIdIsValid()
        {
            // Arrange
            var transactionId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactions = _paymentsMock.Where(p => p.TransactionId == transactionId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    )
                )
                .ReturnsAsync(transactions);

            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentDto>>(transactions),
                Status = ResponseStatus.Success,
                Message = $"{transactions.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentService.FindByTransactionId(transactionId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentService_FindByBusinessPartnerId_ShouldReturnPayments_WhenBusinessPartnerIdIsValid()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactions = _paymentsMock
                .Where(p => p.BusinessPartnerId == businessPartnerId)
                .ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    )
                )
                .ReturnsAsync(transactions);

            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentDto>>(transactions),
                Status = ResponseStatus.Success,
                Message = $"{transactions.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentService_FindByOrderId_ShouldReturnPayments_WhenOrderIdIsValid()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactions = _paymentsMock.Where(p => p.OrderId == orderId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    )
                )
                .ReturnsAsync(transactions);

            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentDto>>(transactions),
                Status = ResponseStatus.Success,
                Message = $"{transactions.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentService.FindByOrderId(orderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        t => t.Transaction
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentService_FindDelayed_ShouldReturnDelayedAndPastItems()
        {
            // Arrange
            var today = DateTime.UtcNow.Date;
            var tomorrowUtc = today.AddDays(1);
            var expectedItems = new List<Payment>
            {
                new Payment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000011"),
                    Description = "Payment A",
                    Date = DateTime.UtcNow.Date.AddDays(-1),
                    Status = PaymentStatus.Pending,
                },
                new Payment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000012"),
                    Description = "Payment B",
                    Date = DateTime.UtcNow.Date.AddDays(-5),
                    Status = PaymentStatus.Delayed,
                },
                new Payment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000013"),
                    Description = "Payment C",
                    Date = DateTime.UtcNow.Date.AddDays(1),
                    Status = PaymentStatus.Approved,
                },
            };

            var expectedQueryItems = expectedItems
                .Where(p =>
                    p.Status == PaymentStatus.Delayed
                    || (
                        p.Status != PaymentStatus.Approved
                        && p.Date != default(DateTime)
                        && p.Date < tomorrowUtc
                    )
                )
                .ToList();

            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        t => t.Transaction,
                        t => t.BusinessPartner,
                        t => t.Order
                    )
                )
                .ReturnsAsync(expectedQueryItems);

            var expected = _mapper
                .Map<IEnumerable<PaymentDto>>(expectedQueryItems)
                .OrderBy(p => p.Date);

            // Act
            var result = await _paymentService.FindDelayed();

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.Should().BeEquivalentTo(expected);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        t => t.Transaction,
                        t => t.BusinessPartner,
                        t => t.Order
                    ),
                Times.Once
            );
        }
    }
}
