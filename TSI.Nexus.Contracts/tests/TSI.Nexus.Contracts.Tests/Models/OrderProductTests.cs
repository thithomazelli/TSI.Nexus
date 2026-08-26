using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class OrderProductTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var order = new Order();
            var product = new Product();
            var orderId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var orderProduct = new OrderProduct
            {
                Description = "Item description",
                Quantity = 2m,
                Discount = 1m,
                Price = 100m,
                OrderId = orderId,
                Order = order,
                ProductId = productId,
                Product = product,
            };

            orderProduct.Description.Should().Be("Item description");
            orderProduct.Quantity.Should().Be(2m);
            orderProduct.Discount.Should().Be(1m);
            orderProduct.Price.Should().Be(100m);
            orderProduct.OrderId.Should().Be(orderId);
            orderProduct.Order.Should().BeSameAs(order);
            orderProduct.ProductId.Should().Be(productId);
            orderProduct.Product.Should().BeSameAs(product);
            // TotalPrice is database-computed (private setter) - defaults to 0.
            orderProduct.TotalPrice.Should().Be(0m);
        }

        [Fact]
        public void DefaultConstructor_LeavesDescriptionEmpty()
        {
            var orderProduct = new OrderProduct();

            orderProduct.Description.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsOrderAndProductFromArguments()
        {
            var order = new Order { Id = Guid.NewGuid() };
            var product = new Product { Id = Guid.NewGuid() };

            var orderProduct = new OrderProduct(order, product);

            orderProduct.Order.Should().BeSameAs(order);
            orderProduct.OrderId.Should().Be(order.Id);
            orderProduct.Product.Should().BeSameAs(product);
            orderProduct.ProductId.Should().Be(product.Id);
        }

        [Fact]
        public void Constructor_WithNullOrder_ThrowsArgumentNullException()
        {
            var product = new Product();

            var act = () => new OrderProduct(null!, product);

            act.Should().Throw<ArgumentNullException>().WithParameterName("order");
        }

        [Fact]
        public void Constructor_WithNullProduct_ThrowsArgumentNullException()
        {
            var order = new Order();

            var act = () => new OrderProduct(order, null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("product");
        }
    }
}
