using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class OrderProductDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var dto = new OrderProductDto
            {
                Id = id,
                Description = "Item description",
                Quantity = 2m,
                PreviousQuantity = 1m,
                Discount = 1m,
                Price = 100m,
                TotalPrice = 198m,
                OrderId = orderId,
                OrderNumber = "ORD-001",
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                ProductId = productId,
                ProductName = "Produto X",
                ProductSku = "SKU-1",
                ProductType = ProductType.Sale,
            };

            dto.Id.Should().Be(id);
            dto.Description.Should().Be("Item description");
            dto.Quantity.Should().Be(2m);
            dto.PreviousQuantity.Should().Be(1m);
            dto.Discount.Should().Be(1m);
            dto.Price.Should().Be(100m);
            dto.TotalPrice.Should().Be(198m);
            dto.OrderId.Should().Be(orderId);
            dto.OrderNumber.Should().Be("ORD-001");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.ProductId.Should().Be(productId);
            dto.ProductName.Should().Be("Produto X");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Sale);
        }
    }
}
