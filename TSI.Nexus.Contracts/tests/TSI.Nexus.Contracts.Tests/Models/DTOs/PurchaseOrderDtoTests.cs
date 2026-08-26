using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class PurchaseOrderDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var date = DateTime.UtcNow;
            var createDate = DateTime.UtcNow.AddDays(-2);
            var modifyDate = DateTime.UtcNow;
            var transaction = new TransactionDto();
            var products = new List<PurchaseOrderProductDto> { new PurchaseOrderProductDto() };

            var dto = new PurchaseOrderDto
            {
                Id = id,
                PurchaseOrderNumber = "PO-001",
                Date = date,
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Fornecedor X",
                Status = OrderStatus.Open,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Description = "Pedido de compra",
                Discount = 100m,
                Price = 2000m,
                TotalPrice = 1900m,
                TransactionId = transactionId,
                Transaction = transaction,
                PurchaseOrderProducts = products,
            };

            dto.Id.Should().Be(id);
            dto.PurchaseOrderNumber.Should().Be("PO-001");
            dto.Date.Should().Be(date);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Fornecedor X");
            dto.Status.Should().Be(OrderStatus.Open);
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Description.Should().Be("Pedido de compra");
            dto.Discount.Should().Be(100m);
            dto.Price.Should().Be(2000m);
            dto.TotalPrice.Should().Be(1900m);
            dto.TransactionId.Should().Be(transactionId);
            dto.Transaction.Should().BeSameAs(transaction);
            dto.PurchaseOrderProducts.Should().BeSameAs(products);
        }

        [Fact]
        public void PurchaseOrderProducts_DefaultsToEmptyCollection()
        {
            var dto = new PurchaseOrderDto();

            dto.PurchaseOrderProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
