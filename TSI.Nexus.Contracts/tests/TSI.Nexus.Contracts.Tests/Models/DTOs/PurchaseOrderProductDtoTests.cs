using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class PurchaseOrderProductDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var dto = new PurchaseOrderProductDto
            {
                Id = id,
                Description = "Item description",
                Quantity = 3m,
                PreviousQuantity = 2m,
                Discount = 0.5m,
                Price = 50m,
                TotalPrice = 149.5m,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrderNumber = "PO-001",
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Fornecedor X",
                ProductId = productId,
                ProductName = "Produto X",
                ProductSku = "SKU-1",
                ProductType = ProductType.Sale,
            };

            dto.Id.Should().Be(id);
            dto.Description.Should().Be("Item description");
            dto.Quantity.Should().Be(3m);
            dto.PreviousQuantity.Should().Be(2m);
            dto.Discount.Should().Be(0.5m);
            dto.Price.Should().Be(50m);
            dto.TotalPrice.Should().Be(149.5m);
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.PurchaseOrderNumber.Should().Be("PO-001");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Fornecedor X");
            dto.ProductId.Should().Be(productId);
            dto.ProductName.Should().Be("Produto X");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Sale);
        }
    }
}
