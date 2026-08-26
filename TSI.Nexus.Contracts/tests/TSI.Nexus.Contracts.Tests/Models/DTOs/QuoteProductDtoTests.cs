using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class QuoteProductDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var dto = new QuoteProductDto
            {
                Id = id,
                Quantity = 5m,
                PreviousQuantity = 3m,
                Discount = 1.5m,
                Price = 10m,
                TotalPrice = 48.5m,
                Status = OrderProductStatus.Delayed,
                OrderId = orderId,
                OrderNumber = "QUO-001",
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                ProductId = productId,
                ProductName = "Produto X",
                ProductSku = "SKU-1",
                ProductType = ProductType.Rental,
            };

            dto.Id.Should().Be(id);
            dto.Quantity.Should().Be(5m);
            dto.PreviousQuantity.Should().Be(3m);
            dto.Discount.Should().Be(1.5m);
            dto.Price.Should().Be(10m);
            dto.TotalPrice.Should().Be(48.5m);
            dto.Status.Should().Be(OrderProductStatus.Delayed);
            dto.OrderId.Should().Be(orderId);
            dto.OrderNumber.Should().Be("QUO-001");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.ProductId.Should().Be(productId);
            dto.ProductName.Should().Be("Produto X");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Rental);
        }
    }
}
