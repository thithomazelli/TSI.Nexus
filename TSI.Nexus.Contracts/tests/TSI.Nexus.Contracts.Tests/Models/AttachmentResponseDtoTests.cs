using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AttachmentResponseDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var vehicleMaintenanceId = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-1);
            var modifyDate = DateTime.UtcNow;

            var dto = new AttachmentResponseDto
            {
                Id = id,
                FileName = "invoice.pdf",
                Path = "BusinessPartners/ClienteX/Orders",
                DownloadUrl = "/api/Attachments/GetFileById/" + id,
                BusinessPartnerId = businessPartnerId,
                OrderId = orderId,
                PurchaseOrderId = purchaseOrderId,
                TripId = tripId,
                TransactionId = transactionId,
                PaymentId = paymentId,
                ProductId = productId,
                VehicleId = vehicleId,
                DriverId = driverId,
                VehicleMaintenanceId = vehicleMaintenanceId,
                UserId = "user-1",
                CreateDate = createDate,
                ModifyDate = modifyDate,
            };

            dto.Id.Should().Be(id);
            dto.FileName.Should().Be("invoice.pdf");
            dto.Path.Should().Be("BusinessPartners/ClienteX/Orders");
            dto.DownloadUrl.Should().Be("/api/Attachments/GetFileById/" + id);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.OrderId.Should().Be(orderId);
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.TripId.Should().Be(tripId);
            dto.TransactionId.Should().Be(transactionId);
            dto.PaymentId.Should().Be(paymentId);
            dto.ProductId.Should().Be(productId);
            dto.VehicleId.Should().Be(vehicleId);
            dto.DriverId.Should().Be(driverId);
            dto.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            dto.UserId.Should().Be("user-1");
            dto.CreateDate.Should().Be(createDate);
            dto.ModifyDate.Should().Be(modifyDate);
        }
    }
}
