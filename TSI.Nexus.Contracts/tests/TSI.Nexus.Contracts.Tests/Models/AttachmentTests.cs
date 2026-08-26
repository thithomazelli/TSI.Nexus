using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AttachmentTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var quote = new Quote();
            var order = new Order();
            var purchaseOrder = new PurchaseOrder();
            var trip = new Trip();
            var transaction = new Transaction();
            var payment = new Payment();
            var product = new Product();
            var vehicle = new Vehicle();
            var driver = new Driver();
            var vehicleMaintenance = new VehicleMaintenance();
            var user = new User();

            var businessPartnerId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var vehicleMaintenanceId = Guid.NewGuid();

            var attachment = new Attachment
            {
                FileName = "contract.pdf",
                Path = "/files/contract.pdf",
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                QuoteId = quoteId,
                Quote = quote,
                OrderId = orderId,
                Order = order,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrder = purchaseOrder,
                TripId = tripId,
                Trip = trip,
                TransactionId = transactionId,
                Transaction = transaction,
                PaymentId = paymentId,
                Payment = payment,
                ProductId = productId,
                Product = product,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                DriverId = driverId,
                Driver = driver,
                VehicleMaintenanceId = vehicleMaintenanceId,
                VehicleMaintenance = vehicleMaintenance,
                UserId = "user-1",
                User = user,
            };

            attachment.FileName.Should().Be("contract.pdf");
            attachment.Path.Should().Be("/files/contract.pdf");
            attachment.BusinessPartnerId.Should().Be(businessPartnerId);
            attachment.BusinessPartner.Should().BeSameAs(businessPartner);
            attachment.QuoteId.Should().Be(quoteId);
            attachment.Quote.Should().BeSameAs(quote);
            attachment.OrderId.Should().Be(orderId);
            attachment.Order.Should().BeSameAs(order);
            attachment.PurchaseOrderId.Should().Be(purchaseOrderId);
            attachment.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            attachment.TripId.Should().Be(tripId);
            attachment.Trip.Should().BeSameAs(trip);
            attachment.TransactionId.Should().Be(transactionId);
            attachment.Transaction.Should().BeSameAs(transaction);
            attachment.PaymentId.Should().Be(paymentId);
            attachment.Payment.Should().BeSameAs(payment);
            attachment.ProductId.Should().Be(productId);
            attachment.Product.Should().BeSameAs(product);
            attachment.VehicleId.Should().Be(vehicleId);
            attachment.Vehicle.Should().BeSameAs(vehicle);
            attachment.DriverId.Should().Be(driverId);
            attachment.Driver.Should().BeSameAs(driver);
            attachment.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            attachment.VehicleMaintenance.Should().BeSameAs(vehicleMaintenance);
            attachment.UserId.Should().Be("user-1");
            attachment.User.Should().BeSameAs(user);
        }
    }
}
