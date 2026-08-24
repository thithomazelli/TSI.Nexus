using System.Globalization;
using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services.Tests.Services
{
    public class DashboardServiceTests
    {
        private readonly Mock<IRepository<Order>> _orderRepoMock;
        private readonly Mock<IRepository<Payment>> _paymentRepoMock;
        private readonly Mock<ILogger<DashboardService>> _loggerMock;
        private readonly DashboardService _service;

        public DashboardServiceTests()
        {
            _orderRepoMock = new Mock<IRepository<Order>>();
            _paymentRepoMock = new Mock<IRepository<Payment>>();
            _loggerMock = new Mock<ILogger<DashboardService>>();

            _service = new DashboardService(
                _orderRepoMock.Object,
                _paymentRepoMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task DashboardService_GetInfoCardsAsync_ShouldReturnExpectedCards()
        {
            // Arrange
            var days = 30;
            var today = DateTime.UtcNow.Date;
            var from = today.AddDays(-days + 1);

            var orders = new List<Order>
            {
                new Order
                {
                    Id = Guid.NewGuid(),
                    CreateDate = today,
                    TotalPrice = 100m,
                },
                new Order
                {
                    Id = Guid.NewGuid(),
                    CreateDate = today.AddDays(-1),
                    TotalPrice = 50m,
                },
            };

            var payments = new List<Payment>
            {
                new Payment
                {
                    Id = Guid.NewGuid(),
                    Date = today,
                    Price = 120m,
                    Status = PaymentStatus.Approved,
                },
                new Payment
                {
                    Id = Guid.NewGuid(),
                    Date = today,
                    Price = 80m,
                    Status = PaymentStatus.Pending,
                },
            };

            // Setup repository aggregations
            _orderRepoMock
                .Setup(r =>
                    r.SumAsync(
                        It.IsAny<Expression<Func<Order, bool>>>(),
                        It.IsAny<Expression<Func<Order, decimal>>>()
                    )
                )
                .ReturnsAsync(orders.Sum(o => o.TotalPrice));

            var total = payments.Sum(p => p.Price);
            var approved = payments
                .Where(p => p.Status == PaymentStatus.Approved)
                .Sum(p => p.Price);
            var pending = payments
                .Where(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Delayed)
                .Sum(p => p.Price);

            _paymentRepoMock
                .SetupSequence(r =>
                    r.SumAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        It.IsAny<Expression<Func<Payment, decimal>>>()
                    )
                )
                .ReturnsAsync(total) // first call -> totalPayments
                .ReturnsAsync(approved) // second call -> approvedSum
                .ReturnsAsync(pending); // third call -> pendingDelayedSum

            // Act
            var response = await _service.GetInfoCardsAsync(days);

            // Assert
            response.Should().NotBeNull();
            response.Status.Should().Be(ResponseStatus.Success);
            response.Data.Should().NotBeNull();
            var cards = response.Data.ToList();
            cards.Should().HaveCount(4);

            // Orders sum
            var ordersCard = cards.FirstOrDefault(c =>
                c.Title.Contains("Novos Pedidos") || c.Title.Contains("Orders")
            );
            ordersCard.Should().NotBeNull();
            ordersCard
                .Value.Should()
                .Be(
                    (orders.Sum(o => o.TotalPrice)).ToString(
                        "C",
                        CultureInfo.GetCultureInfo("pt-BR")
                    )
                );

            // Percentages
            var receivedCard = cards.FirstOrDefault(c => c.Title.Contains("Recebidos"));
            var waitingCard = cards.FirstOrDefault(c => c.Title.Contains("Aguardando"));
            receivedCard.Should().NotBeNull();
            waitingCard.Should().NotBeNull();

            var totalPayments = total;
            var approvedPct =
                totalPayments == 0
                    ? 0
                    : (decimal)Math.Round((double)(100m * approved / totalPayments));
            var pendingPct =
                totalPayments == 0
                    ? 0
                    : (decimal)Math.Round((double)(100m * pending / totalPayments));

            receivedCard.Value.Should().Be(approvedPct.ToString() + "%");
            waitingCard.Value.Should().Be(pendingPct.ToString() + "%");

            // 4th card: fixed placeholder now that the rental/return cycle is gone
            var placeholderCard = cards.FirstOrDefault(c => c.Title.Contains("Em Breve"));
            placeholderCard.Should().NotBeNull();

            // Verify repo calls
            _orderRepoMock.Verify(
                r =>
                    r.SumAsync(
                        It.IsAny<Expression<Func<Order, bool>>>(),
                        It.IsAny<Expression<Func<Order, decimal>>>()
                    ),
                Times.Once
            );
            _paymentRepoMock.Verify(
                r =>
                    r.SumAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        It.IsAny<Expression<Func<Payment, decimal>>>()
                    ),
                Times.Exactly(3)
            );
        }
    }
}
