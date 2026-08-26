using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class ProductTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var orderProducts = new List<OrderProduct> { new OrderProduct() };
            var productPhotos = new List<ProductPhoto> { new ProductPhoto() };
            var attachments = new List<Attachment> { new Attachment() };

            var product = new Product
            {
                Sku = "SKU-1",
                Name = "Cadeira",
                Description = "Cadeira de escritório",
                Photo = "photo.png",
                Price = 199.9m,
                Category = "Móveis",
                Unit = ProductUnit.Unit,
                Type = ProductType.Sale,
                QuantityInStock = 10,
                OrderProducts = orderProducts,
                ProductPhotos = productPhotos,
                Attachments = attachments,
            };

            product.Sku.Should().Be("SKU-1");
            product.Name.Should().Be("Cadeira");
            product.Description.Should().Be("Cadeira de escritório");
            product.Photo.Should().Be("photo.png");
            product.Price.Should().Be(199.9m);
            product.Category.Should().Be("Móveis");
            product.Unit.Should().Be(ProductUnit.Unit);
            product.Type.Should().Be(ProductType.Sale);
            product.QuantityInStock.Should().Be(10);
            product.OrderProducts.Should().BeSameAs(orderProducts);
            product.ProductPhotos.Should().BeSameAs(productPhotos);
            product.Attachments.Should().BeSameAs(attachments);
        }

        [Fact]
        public void OrderProducts_DefaultsToEmptyCollection()
        {
            var product = new Product();

            product.OrderProducts.Should().NotBeNull().And.BeEmpty();
        }
    }
}
