using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class ProductPhotoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var product = new Product();
            var productId = Guid.NewGuid();

            var photo = new ProductPhoto
            {
                FileName = "photo.png",
                IsDefault = true,
                ProductId = productId,
                Product = product,
            };

            photo.FileName.Should().Be("photo.png");
            photo.IsDefault.Should().BeTrue();
            photo.ProductId.Should().Be(productId);
            photo.Product.Should().BeSameAs(product);
        }
    }
}
