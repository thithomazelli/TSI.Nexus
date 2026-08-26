using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class QuoteDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-3);
            var modifyDate = DateTime.UtcNow;
            var date = DateTime.UtcNow;
            var quoteProducts = new List<QuoteProductDto> { new QuoteProductDto() };
            var quoteTrip = new QuoteTripDto();

            var dto = new QuoteDto
            {
                Id = id,
                QuoteNumber = "QUO-001",
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Date = date,
                Status = QuoteStatus.Open,
                Type = QuoteType.Trip,
                Description = "Orçamento",
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
                BusinessPartnerName = "Cliente X",
                QuoteProducts = quoteProducts,
                QuoteTrip = quoteTrip,
            };

            dto.Id.Should().Be(id);
            dto.QuoteNumber.Should().Be("QUO-001");
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Date.Should().Be(date);
            dto.Status.Should().Be(QuoteStatus.Open);
            dto.Type.Should().Be(QuoteType.Trip);
            dto.Description.Should().Be("Orçamento");
            dto.Price.Should().Be(3000m);
            dto.TotalPrice.Should().Be(2900m);
            dto.Discount.Should().Be(100m);
            dto.Condition.Should().Be(PaymentCondition.InInstallments);
            dto.Method.Should().Be(PaymentMethod.CreditCard);
            dto.TotalOfPayments.Should().Be(3);
            dto.PaymentTotalPrice.Should().Be(1000m);
            dto.TotalOfExpenses.Should().Be(1);
            dto.ExpenseTotalPrice.Should().Be(200m);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.QuoteProducts.Should().BeSameAs(quoteProducts);
            dto.QuoteTrip.Should().BeSameAs(quoteTrip);
        }

        [Fact]
        public void QuoteProducts_DefaultsToEmptyCollection()
        {
            var dto = new QuoteDto();

            dto.QuoteProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
