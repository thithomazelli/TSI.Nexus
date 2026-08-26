using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class TransactionTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var payments = new List<Payment> { new Payment() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var order = new Order();
            var purchaseOrder = new PurchaseOrder();
            var trip = new Trip();
            var businessPartner = new Individual();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var transaction = new Transaction
            {
                Date = date,
                Description = "Venda de produto",
                Payments = payments,
                Status = PaymentStatus.Pending,
                OrderId = orderId,
                Order = order,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrder = purchaseOrder,
                TripId = tripId,
                Trip = trip,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                Attachments = attachments,
                Events = events,
            };

            transaction.Date.Should().Be(date);
            transaction.Description.Should().Be("Venda de produto");
            transaction.Payments.Should().BeSameAs(payments);
            transaction.Status.Should().Be(PaymentStatus.Pending);
            transaction.OrderId.Should().Be(orderId);
            transaction.Order.Should().BeSameAs(order);
            transaction.PurchaseOrderId.Should().Be(purchaseOrderId);
            transaction.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            transaction.TripId.Should().Be(tripId);
            transaction.Trip.Should().BeSameAs(trip);
            transaction.BusinessPartnerId.Should().Be(businessPartnerId);
            transaction.BusinessPartner.Should().BeSameAs(businessPartner);
            transaction.Attachments.Should().BeSameAs(attachments);
            transaction.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void Payments_DefaultsToEmptyCollection()
        {
            var transaction = new Transaction();

            transaction.Payments.Should().NotBeNull().And.BeEmpty();
        }
    }
}
