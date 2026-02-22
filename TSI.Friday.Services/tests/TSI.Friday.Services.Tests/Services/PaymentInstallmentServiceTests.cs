using System.Linq.Expressions;
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
    public class PaymentInstallmentServiceTests
    {
        private readonly PaymentInstallmentService _paymentInstallmentService;
        private readonly Mock<IRepository<PaymentInstallment>> _repository;
        private readonly IList<PaymentInstallment> _paymentInstallmentsMock;
        private readonly IMapper _mapper;

        public PaymentInstallmentServiceTests()
        {
            _repository = new Mock<IRepository<PaymentInstallment>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _paymentInstallmentService = new PaymentInstallmentService(_repository.Object, _mapper);

            _paymentInstallmentsMock = new List<PaymentInstallment>
            {
                new PaymentInstallment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Pagamento 1",
                    PaymentId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new PaymentInstallment
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Pagamento 2",
                    PaymentId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
            };
        }

        [Fact]
        public async Task PaymentInstallmentService_Add_ShouldAddPaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentInstallmentDto = new PaymentInstallmentDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Pagamento 3",
                PaymentId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentInstallmentDto,
                Status = ResponseStatus.Success,
                Message =
                    $"Parcela do pagamento {paymentInstallmentDto.Description} cadastrada com sucesso.",
            };

            // Act
            var result = await _paymentInstallmentService.Add(paymentInstallmentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_Update_ShouldUpdatePaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentInstallmentDto = _mapper.Map<PaymentInstallmentDto>(
                _paymentInstallmentsMock.First()
            );
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentInstallmentDto,
                Status = ResponseStatus.Success,
                Message =
                    $"Parcela do pagamento {paymentInstallmentDto.Description} atualizada com sucesso.",
            };

            // Act
            var result = await _paymentInstallmentService.Update(paymentInstallmentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_Remove_ShouldRemovePaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentInstallmentDto = _mapper.Map<PaymentInstallmentDto>(
                _paymentInstallmentsMock.First()
            );
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentInstallmentDto,
                Status = ResponseStatus.Success,
                Message =
                    $"Parcela do pagamento {paymentInstallmentDto.Description} removida com sucesso.",
            };

            // Act
            var result = await _paymentInstallmentService.Remove(paymentInstallmentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_FindById_ShouldReturnPaymentInstallment_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var payment = _paymentInstallmentsMock.First(p => p.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(payment);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = _mapper.Map<PaymentInstallmentDto>(payment),
                Status = ResponseStatus.Success,
                Message = $"Parcela do pagamento {payment.Description} encontrada com sucesso",
            };

            // Act
            var result = await _paymentInstallmentService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByPaymentId_ShouldReturnPaymentInstallments_WhenPaymentIdIsValid()
        {
            // Arrange
            var paymentId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            ;
            var payments = _paymentInstallmentsMock.Where(p => p.PaymentId == paymentId).ToList();
            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()))
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentInstallmentService.FindByPaymentId(paymentId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByBusinessPartnerId_ShouldReturnPaymentInstallments_WhenBusinessPartnerIdIsValid()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            ;
            var payments = _paymentInstallmentsMock
                .Where(p => p.BusinessPartnerId == businessPartnerId)
                .ToList();
            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()))
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentInstallmentService.FindByBusinessPartnerId(
                businessPartnerId
            );

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByOrderId_ShouldReturnPaymentInstallments_WhenOrderIdIsValid()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var payments = _paymentInstallmentsMock.Where(p => p.OrderId == orderId).ToList();
            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()))
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentInstallmentService.FindByOrderId(orderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r => r.QueryAsync(It.IsAny<Expression<Func<PaymentInstallment, bool>>>()),
                Times.Once
            );
        }
    }
}
