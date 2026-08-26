using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class PurchaseOrderTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var transaction = new Transaction();
            var payments = new List<Payment> { new Payment() };
            var purchaseOrderProducts = new List<PurchaseOrderProduct> { new PurchaseOrderProduct() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var businessPartnerId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var purchaseOrder = new PurchaseOrder
            {
                PurchaseOrderNumber = "PO-001",
                Date = date,
                Status = OrderStatus.Open,
                Description = "Pedido de compra",
                Price = 2000m,
                TotalPrice = 1900m,
                Discount = 100m,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                TransactionId = transactionId,
                Transaction = transaction,
                Payments = payments,
                PurchaseOrderProducts = purchaseOrderProducts,
                Attachments = attachments,
                Events = events,
            };

            purchaseOrder.PurchaseOrderNumber.Should().Be("PO-001");
            purchaseOrder.Date.Should().Be(date);
            purchaseOrder.Status.Should().Be(OrderStatus.Open);
            purchaseOrder.Description.Should().Be("Pedido de compra");
            purchaseOrder.Price.Should().Be(2000m);
            purchaseOrder.TotalPrice.Should().Be(1900m);
            purchaseOrder.Discount.Should().Be(100m);
            purchaseOrder.BusinessPartnerId.Should().Be(businessPartnerId);
            purchaseOrder.BusinessPartner.Should().BeSameAs(businessPartner);
            purchaseOrder.TransactionId.Should().Be(transactionId);
            purchaseOrder.Transaction.Should().BeSameAs(transaction);
            purchaseOrder.Payments.Should().BeSameAs(payments);
            purchaseOrder.PurchaseOrderProducts.Should().BeSameAs(purchaseOrderProducts);
            purchaseOrder.Attachments.Should().BeSameAs(attachments);
            purchaseOrder.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void CollectionProperties_DefaultToEmptyCollections()
        {
            var purchaseOrder = new PurchaseOrder();

            purchaseOrder.PurchaseOrderNumber.Should().BeEmpty();
            purchaseOrder.Description.Should().BeEmpty();
            purchaseOrder.Payments.Should().NotBeNull().And.BeEmpty();
            purchaseOrder.PurchaseOrderProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
