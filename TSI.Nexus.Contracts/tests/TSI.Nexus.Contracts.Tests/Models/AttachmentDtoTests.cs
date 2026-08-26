using System;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AttachmentDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var file = Mock.Of<IFormFile>();
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var vehicleMaintenanceId = Guid.NewGuid();

            var dto = new AttachmentDto
            {
                File = file,
                Id = id,
                BusinessPartnerId = businessPartnerId,
                OrderId = orderId,
                OrderNumber = "ORD-001",
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrderNumber = "PO-001",
                TripId = tripId,
                TripNumber = "TRIP-001",
                QuoteId = quoteId,
                TransactionId = transactionId,
                PaymentId = paymentId,
                ProductId = productId,
                VehicleId = vehicleId,
                DriverId = driverId,
                VehicleMaintenanceId = vehicleMaintenanceId,
                UserId = "user-1",
            };

            dto.File.Should().BeSameAs(file);
            dto.Id.Should().Be(id);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.OrderId.Should().Be(orderId);
            dto.OrderNumber.Should().Be("ORD-001");
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.PurchaseOrderNumber.Should().Be("PO-001");
            dto.TripId.Should().Be(tripId);
            dto.TripNumber.Should().Be("TRIP-001");
            dto.QuoteId.Should().Be(quoteId);
            dto.TransactionId.Should().Be(transactionId);
            dto.PaymentId.Should().Be(paymentId);
            dto.ProductId.Should().Be(productId);
            dto.VehicleId.Should().Be(vehicleId);
            dto.DriverId.Should().Be(driverId);
            dto.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            dto.UserId.Should().Be("user-1");
        }
    }
}
