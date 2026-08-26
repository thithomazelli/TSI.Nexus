using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class OrderTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var transaction = new Transaction();
            var payments = new List<Payment> { new Payment() };
            var orderProducts = new List<OrderProduct> { new OrderProduct() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var businessPartnerId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var order = new Order
            {
                OrderNumber = "ORD-001",
                QuoteNumber = "QUO-001",
                Date = date,
                Status = OrderStatus.Open,
                Description = "Pedido de venda",
                Price = 1000m,
                TotalPrice = 950m,
                Discount = 50m,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                TransactionId = transactionId,
                Transaction = transaction,
                Payments = payments,
                OrderProducts = orderProducts,
                Attachments = attachments,
                Events = events,
            };

            order.OrderNumber.Should().Be("ORD-001");
            order.QuoteNumber.Should().Be("QUO-001");
            order.Date.Should().Be(date);
            order.Status.Should().Be(OrderStatus.Open);
            order.Description.Should().Be("Pedido de venda");
            order.Price.Should().Be(1000m);
            order.TotalPrice.Should().Be(950m);
            order.Discount.Should().Be(50m);
            order.BusinessPartnerId.Should().Be(businessPartnerId);
            order.BusinessPartner.Should().BeSameAs(businessPartner);
            order.TransactionId.Should().Be(transactionId);
            order.Transaction.Should().BeSameAs(transaction);
            order.Payments.Should().BeSameAs(payments);
            order.OrderProducts.Should().BeSameAs(orderProducts);
            order.Attachments.Should().BeSameAs(attachments);
            order.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void CollectionProperties_DefaultToEmptyCollections()
        {
            var order = new Order();

            order.OrderNumber.Should().BeEmpty();
            order.QuoteNumber.Should().BeEmpty();
            order.Description.Should().BeEmpty();
            order.Payments.Should().NotBeNull().And.BeEmpty();
            order.OrderProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
