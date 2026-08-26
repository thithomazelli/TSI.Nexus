using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class PurchaseOrderProductTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var purchaseOrder = new PurchaseOrder();
            var product = new Product();
            var purchaseOrderId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var purchaseOrderProduct = new PurchaseOrderProduct
            {
                Description = "Item description",
                Quantity = 3m,
                Discount = 0.5m,
                Price = 50m,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrder = purchaseOrder,
                ProductId = productId,
                Product = product,
            };

            purchaseOrderProduct.Description.Should().Be("Item description");
            purchaseOrderProduct.Quantity.Should().Be(3m);
            purchaseOrderProduct.Discount.Should().Be(0.5m);
            purchaseOrderProduct.Price.Should().Be(50m);
            purchaseOrderProduct.PurchaseOrderId.Should().Be(purchaseOrderId);
            purchaseOrderProduct.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            purchaseOrderProduct.ProductId.Should().Be(productId);
            purchaseOrderProduct.Product.Should().BeSameAs(product);
            purchaseOrderProduct.TotalPrice.Should().Be(0m);
        }

        [Fact]
        public void DefaultConstructor_LeavesDescriptionEmpty()
        {
            var purchaseOrderProduct = new PurchaseOrderProduct();

            purchaseOrderProduct.Description.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsPurchaseOrderAndProductFromArguments()
        {
            var purchaseOrder = new PurchaseOrder { Id = Guid.NewGuid() };
            var product = new Product { Id = Guid.NewGuid() };

            var purchaseOrderProduct = new PurchaseOrderProduct(purchaseOrder, product);

            purchaseOrderProduct.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            purchaseOrderProduct.PurchaseOrderId.Should().Be(purchaseOrder.Id);
            purchaseOrderProduct.Product.Should().BeSameAs(product);
            purchaseOrderProduct.ProductId.Should().Be(product.Id);
        }

        [Fact]
        public void Constructor_WithNullPurchaseOrder_ThrowsArgumentNullException()
        {
            var product = new Product();

            var act = () => new PurchaseOrderProduct(null!, product);

            act.Should().Throw<ArgumentNullException>().WithParameterName("purchaseOrder");
        }

        [Fact]
        public void Constructor_WithNullProduct_ThrowsArgumentNullException()
        {
            var purchaseOrder = new PurchaseOrder();

            var act = () => new PurchaseOrderProduct(purchaseOrder, null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("product");
        }
    }
}
