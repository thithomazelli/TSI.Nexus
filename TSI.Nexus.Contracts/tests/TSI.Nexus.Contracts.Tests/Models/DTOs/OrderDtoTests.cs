using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class OrderDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var date = DateTime.UtcNow;
            var createDate = DateTime.UtcNow.AddDays(-2);
            var modifyDate = DateTime.UtcNow;
            var transaction = new TransactionDto();
            var orderProducts = new List<OrderProductDto> { new OrderProductDto() };

            var dto = new OrderDto
            {
                Id = id,
                OrderNumber = "ORD-001",
                Date = date,
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                Status = OrderStatus.Open,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Description = "Pedido de venda",
                Discount = 50m,
                Price = 1000m,
                TotalPrice = 950m,
                QuoteId = quoteId,
                QuoteNumber = "QUO-001",
                TransactionId = transactionId,
                Transaction = transaction,
                OrderProducts = orderProducts,
            };

            dto.Id.Should().Be(id);
            dto.OrderNumber.Should().Be("ORD-001");
            dto.Date.Should().Be(date);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.Status.Should().Be(OrderStatus.Open);
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Description.Should().Be("Pedido de venda");
            dto.Discount.Should().Be(50m);
            dto.Price.Should().Be(1000m);
            dto.TotalPrice.Should().Be(950m);
            dto.QuoteId.Should().Be(quoteId);
            dto.QuoteNumber.Should().Be("QUO-001");
            dto.TransactionId.Should().Be(transactionId);
            dto.Transaction.Should().BeSameAs(transaction);
            dto.OrderProducts.Should().BeSameAs(orderProducts);
        }

        [Fact]
        public void OrderProducts_DefaultsToEmptyCollection()
        {
            var dto = new OrderDto();

            dto.OrderProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
