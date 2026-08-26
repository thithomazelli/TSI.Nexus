using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class QuoteTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var quoteProducts = new List<QuoteProduct> { new QuoteProduct() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var quoteTrip = new QuoteTrip();
            var businessPartnerId = Guid.NewGuid();
            var date = DateTime.UtcNow;

            var quote = new Quote
            {
                QuoteNumber = "QUO-001",
                Date = date,
                Status = QuoteStatus.Open,
                Type = QuoteType.Trip,
                Description = "Orçamento de viagem",
                Price = 3000m,
                TotalPrice = 2900m,
                Discount = 100m,
                Condition = PaymentCondition.InInstallments,
                Method = PaymentMethod.CreditCard,
                TotalOfPayments = 3,
                PaymentTotalPrice = 1000m,
                TotalOfExpenses = 1,
                ExpenseTotalPrice = 200m,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                QuoteProducts = quoteProducts,
                Attachments = attachments,
                Events = events,
                QuoteTrip = quoteTrip,
            };

            quote.QuoteNumber.Should().Be("QUO-001");
            quote.Date.Should().Be(date);
            quote.Status.Should().Be(QuoteStatus.Open);
            quote.Type.Should().Be(QuoteType.Trip);
            quote.Description.Should().Be("Orçamento de viagem");
            quote.Price.Should().Be(3000m);
            quote.TotalPrice.Should().Be(2900m);
            quote.Discount.Should().Be(100m);
            quote.Condition.Should().Be(PaymentCondition.InInstallments);
            quote.Method.Should().Be(PaymentMethod.CreditCard);
            quote.TotalOfPayments.Should().Be(3);
            quote.PaymentTotalPrice.Should().Be(1000m);
            quote.TotalOfExpenses.Should().Be(1);
            quote.ExpenseTotalPrice.Should().Be(200m);
            quote.BusinessPartnerId.Should().Be(businessPartnerId);
            quote.BusinessPartner.Should().BeSameAs(businessPartner);
            quote.QuoteProducts.Should().BeSameAs(quoteProducts);
            quote.Attachments.Should().BeSameAs(attachments);
            quote.Events.Should().BeSameAs(events);
            quote.QuoteTrip.Should().BeSameAs(quoteTrip);
        }

        [Fact]
        public void QuoteProducts_DefaultsToEmptyCollection()
        {
            var quote = new Quote();

            quote.QuoteNumber.Should().BeEmpty();
            quote.Description.Should().BeEmpty();
            quote.QuoteProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
