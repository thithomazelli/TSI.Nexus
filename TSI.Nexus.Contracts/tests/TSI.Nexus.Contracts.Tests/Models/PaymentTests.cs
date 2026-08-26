using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class PaymentTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var transaction = new Transaction();
            var businessPartner = new Individual();
            var order = new Order();
            var purchaseOrder = new PurchaseOrder();
            var trip = new Trip();
            var driver = new Driver();
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var transactionId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var payment = new Payment
            {
                Type = PaymentType.Incoming,
                Status = PaymentStatus.Approved,
                Condition = PaymentCondition.FullPayment,
                Method = PaymentMethod.Pix,
                Category = "Vendas",
                Date = date,
                Description = "Pagamento à vista",
                PaymentNumber = 1,
                Price = 500m,
                TransactionId = transactionId,
                Transaction = transaction,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                OrderId = orderId,
                Order = order,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrder = purchaseOrder,
                TripId = tripId,
                Trip = trip,
                DriverId = driverId,
                Driver = driver,
                Attachments = attachments,
                Events = events,
            };

            payment.Type.Should().Be(PaymentType.Incoming);
            payment.Status.Should().Be(PaymentStatus.Approved);
            payment.Condition.Should().Be(PaymentCondition.FullPayment);
            payment.Method.Should().Be(PaymentMethod.Pix);
            payment.Category.Should().Be("Vendas");
            payment.Date.Should().Be(date);
            payment.Description.Should().Be("Pagamento à vista");
            payment.PaymentNumber.Should().Be(1);
            payment.Price.Should().Be(500m);
            payment.TransactionId.Should().Be(transactionId);
            payment.Transaction.Should().BeSameAs(transaction);
            payment.BusinessPartnerId.Should().Be(businessPartnerId);
            payment.BusinessPartner.Should().BeSameAs(businessPartner);
            payment.OrderId.Should().Be(orderId);
            payment.Order.Should().BeSameAs(order);
            payment.PurchaseOrderId.Should().Be(purchaseOrderId);
            payment.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            payment.TripId.Should().Be(tripId);
            payment.Trip.Should().BeSameAs(trip);
            payment.DriverId.Should().Be(driverId);
            payment.Driver.Should().BeSameAs(driver);
            payment.Attachments.Should().BeSameAs(attachments);
            payment.Events.Should().BeSameAs(events);
        }
    }
}
