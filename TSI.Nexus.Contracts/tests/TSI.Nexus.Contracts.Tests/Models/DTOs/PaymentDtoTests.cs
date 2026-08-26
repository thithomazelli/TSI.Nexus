using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class PaymentDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var dto = new PaymentDto
            {
                Id = id,
                Type = PaymentType.Incoming,
                Status = PaymentStatus.Approved,
                Condition = PaymentCondition.FullPayment,
                Method = PaymentMethod.Cash,
                Category = "Vendas",
                Date = date,
                Description = "Pagamento",
                PaymentNumber = 1,
                Price = 500m,
                TransactionId = transactionId,
                TransactionDescription = "Venda de produto",
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                BusinessPartnerType = BusinessPartnerType.Client,
                OrderId = orderId,
                OrderNumber = "ORD-001",
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrderNumber = "PO-001",
                TripId = tripId,
                TripNumber = "TRIP-001",
                DriverId = driverId,
                DriverName = "Carlos",
            };

            dto.Id.Should().Be(id);
            dto.Type.Should().Be(PaymentType.Incoming);
            dto.Status.Should().Be(PaymentStatus.Approved);
            dto.Condition.Should().Be(PaymentCondition.FullPayment);
            dto.Method.Should().Be(PaymentMethod.Cash);
            dto.Category.Should().Be("Vendas");
            dto.Date.Should().Be(date);
            dto.Description.Should().Be("Pagamento");
            dto.PaymentNumber.Should().Be(1);
            dto.Price.Should().Be(500m);
            dto.TransactionId.Should().Be(transactionId);
            dto.TransactionDescription.Should().Be("Venda de produto");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.BusinessPartnerType.Should().Be(BusinessPartnerType.Client);
            dto.OrderId.Should().Be(orderId);
            dto.OrderNumber.Should().Be("ORD-001");
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.PurchaseOrderNumber.Should().Be("PO-001");
            dto.TripId.Should().Be(tripId);
            dto.TripNumber.Should().Be("TRIP-001");
            dto.DriverId.Should().Be(driverId);
            dto.DriverName.Should().Be("Carlos");
        }
    }
}
