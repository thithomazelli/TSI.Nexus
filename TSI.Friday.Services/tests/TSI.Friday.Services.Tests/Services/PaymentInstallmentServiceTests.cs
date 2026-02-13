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
        private readonly PaymentInstallmentService _service;
        private readonly Mock<IRepository<PaymentInstallment>> _repository;
        private readonly IList<PaymentInstallment> _paymentsMock;
        private readonly IMapper _mapper;

        public PaymentInstallmentServiceTests()
        {
            _repository = new Mock<IRepository<PaymentInstallment>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _service = new PaymentInstallmentService(_repository.Object, _mapper);

            _paymentsMock = new List<PaymentInstallment>
            {
                new PaymentInstallment
                {
                    Id = 1,
                    Description = "Pagamento 1",
                    PaymentId = 1,
                },
                new PaymentInstallment
                {
                    Id = 2,
                    Description = "Pagamento 2",
                    PaymentId = 2,
                },
            };
        }

        [Fact]
        public async Task PaymentInstallmentService_Add_ShouldAddPaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = new PaymentInstallmentDto
            {
                Id = 3,
                Description = "Pagamento 3",
                PaymentId = 3,
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} cadastrado com sucesso.",
            };

            // Act
            var result = await _service.Add(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_Update_ShouldUpdatePaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _mapper.Map<PaymentInstallmentDto>(_paymentsMock.First());
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} atualizado com sucesso.",
            };

            // Act
            var result = await _service.Update(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_Remove_ShouldRemovePaymentInstallmentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _mapper.Map<PaymentInstallmentDto>(_paymentsMock.First());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<PaymentInstallment>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} removido com sucesso.",
            };

            // Act
            var result = await _service.Remove(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<PaymentInstallment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_FindById_ShouldReturnPaymentInstallment_WhenIdIsValid()
        {
            // Arrange
            const int id = 1;
            var payment = _paymentsMock.First(p => p.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(payment);

            var expected = new WebApiResponse<PaymentInstallmentDto>
            {
                Data = _mapper.Map<PaymentInstallmentDto>(payment),
                Status = ResponseStatus.Success,
                Message = $"Pagamento {payment.Description} encontrado com sucesso",
            };

            // Act
            var result = await _service.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByPaymentId_ShouldReturnPaymentInstallments_WhenPaymentIdIsValid()
        {
            // Arrange
            const int paymentId = 1;
            var payments = _paymentsMock.Where(p => p.PaymentId == paymentId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    )
                )
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _service.FindByPaymentId(paymentId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByClientId_ShouldReturnPaymentInstallments_WhenClientIdIsValid()
        {
            // Arrange
            const int clientId = 1;
            var payments = _paymentsMock.Where(p => p.ClientId == clientId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    )
                )
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _service.FindByClientId(clientId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PaymentInstallmentService_FindByOrderId_ShouldReturnPaymentInstallments_WhenOrderIdIsValid()
        {
            // Arrange
            const int orderId = 1;
            var payments = _paymentsMock.Where(p => p.OrderId == orderId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    )
                )
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentInstallmentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _service.FindByOrderId(orderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<
                            Func<PaymentInstallment, bool>
                        >>()
                    ),
                Times.Once
            );
        }
    }
}
