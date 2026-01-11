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
    public class PaymentServiceTests
    {
        private readonly PaymentService _service;
        private readonly Mock<IRepository<Payment>> _repository;
        private readonly IList<Payment> _paymentsMock;
        private readonly IMapper _mapper;

        public PaymentServiceTests()
        {
            _repository = new Mock<IRepository<Payment>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _service = new PaymentService(_repository.Object, _mapper);

            _paymentsMock = new List<Payment>
            {
                new Payment { Id = 1, Description = "Pagamento 1", ClientId = 1, OrderId = 1 },
                new Payment { Id = 2, Description = "Pagamento 2", ClientId = 2, OrderId = 1 }
            };
        }

        [Fact]
        public async Task PaymentService_Add_ShouldAddPaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = new PaymentDto { Id = 3, Description = "Pagamento 3", ClientId = 3, OrderId = 2 };
            _repository.Setup(r => r.AddAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} cadastrado com sucesso."
            };

            // Act
            var result = await _service.Add(paymentDto);

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
                Message = $"Pagamento {paymentDto.Description} atualizado com sucesso."
            };

            // Act
            var result = await _service.Update(paymentDto);

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
                Message = $"Pagamento {paymentDto.Description} removido com sucesso."
            };

            // Act
            var result = await _service.Remove(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindById_ShouldReturnPayment_WhenIdIsValid()
        {
            // Arrange
            const int id = 1;
            var payment = _paymentsMock.First(p => p.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(payment);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = _mapper.Map<PaymentDto>(payment),
                Status = ResponseStatus.Success,
                Message = $"Pagamento {payment.Description} encontrado com sucesso"
            };

            // Act
            var result = await _service.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindByClientId_ShouldReturnPayments_WhenClientIdIsValid()
        {
            // Arrange
            const int clientId = 1;
            var payments = _paymentsMock.Where(p => p.ClientId == clientId).ToList();
            _repository.Setup(r => r.QueryAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>()))
                .ReturnsAsync(payments);

            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = _mapper.Map<IEnumerable<PaymentDto>>(payments),
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s)."
            };

            // Act
            var result = await _service.FindByClientId(clientId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.QueryAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>()), Times.Once);
        }
    }
}