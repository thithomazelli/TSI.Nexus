using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class PaymentsControllerTests
    {
        private readonly PaymentsController _controller;
        private readonly Mock<IPaymentService> _serviceMock;
        private readonly IList<PaymentDto> _paymentsMock;

        public PaymentsControllerTests()
        {
            _serviceMock = new Mock<IPaymentService>();
            _controller = new PaymentsController(_serviceMock.Object);

            _paymentsMock = new List<PaymentDto>
            {
                new PaymentDto { Id =1, Description = "Pagamento1", ClientId =1, OrderId =1 },
                new PaymentDto { Id =2, Description = "Pagamento2", ClientId =2, OrderId =1 }
            };
        }

        [Fact]
        public async Task GetByClientId_ShouldReturnOkWithPayments_WhenServiceReturnsPayments()
        {
            // Arrange
            const int clientId =1;
            var payments = _paymentsMock.Where(p => p.ClientId == clientId).ToList();
            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = payments,
                Status = ResponseStatus.Success,
                Message = $"{payments.Count} registro(s) encontrado(s)."
            };

            _serviceMock.Setup(s => s.FindByClientId(clientId)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByClientId(clientId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<PaymentDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindByClientId(clientId), Times.Once);
        }

        [Fact]
        public async Task GetById_ShouldReturnOkWithPayment_WhenServiceReturnsPayment()
        {
            // Arrange
            const int id =1;
            var payment = _paymentsMock.First(p => p.Id == id);
            var expected = new WebApiResponse<PaymentDto>
            {
                Data = payment,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {payment.Description} encontrado com sucesso"
            };

            _serviceMock.Setup(s => s.FindById(id)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PaymentDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindById(id), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnOkWithCreatedPayment_WhenModelIsValid()
        {
            // Arrange
            var payment = new PaymentDto { Id =3, Description = "Pagamento3", ClientId =3, OrderId =2 };
            var expected = new WebApiResponse<PaymentDto>
            {
                Data = payment,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {payment.Description} cadastrado com sucesso."
            };

            _serviceMock.Setup(s => s.Add(payment)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(payment);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<PaymentDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.Add(payment), Times.Once);
        }
    }
}