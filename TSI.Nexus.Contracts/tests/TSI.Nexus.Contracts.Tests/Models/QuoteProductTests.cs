using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class QuoteProductTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var quote = new Quote();
            var product = new Product();
            var quoteId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var quoteProduct = new QuoteProduct
            {
                Quantity = 4m,
                Discount = 2m,
                Price = 25m,
                Status = OrderProductStatus.InProgress,
                QuoteId = quoteId,
                Quote = quote,
                ProductId = productId,
                Product = product,
            };

            quoteProduct.Quantity.Should().Be(4m);
            quoteProduct.Discount.Should().Be(2m);
            quoteProduct.Price.Should().Be(25m);
            quoteProduct.Status.Should().Be(OrderProductStatus.InProgress);
            quoteProduct.QuoteId.Should().Be(quoteId);
            quoteProduct.Quote.Should().BeSameAs(quote);
            quoteProduct.ProductId.Should().Be(productId);
            quoteProduct.Product.Should().BeSameAs(product);
            quoteProduct.TotalPrice.Should().Be(0m);
        }

        [Fact]
        public void DefaultConstructor_StatusDefaultsToInProgress()
        {
            var quoteProduct = new QuoteProduct();

            quoteProduct.Status.Should().Be(OrderProductStatus.InProgress);
        }

        [Fact]
        public void Constructor_SetsQuoteAndProductFromArguments()
        {
            var quote = new Quote { Id = Guid.NewGuid() };
            var product = new Product { Id = Guid.NewGuid() };

            var quoteProduct = new QuoteProduct(quote, product);

            quoteProduct.Quote.Should().BeSameAs(quote);
            quoteProduct.QuoteId.Should().Be(quote.Id);
            quoteProduct.Product.Should().BeSameAs(product);
            quoteProduct.ProductId.Should().Be(product.Id);
        }

        [Fact]
        public void Constructor_WithNullQuote_ThrowsArgumentNullException()
        {
            var product = new Product();

            var act = () => new QuoteProduct(null!, product);

            act.Should().Throw<ArgumentNullException>().WithParameterName("quote");
        }

        [Fact]
        public void Constructor_WithNullProduct_ThrowsArgumentNullException()
        {
            var quote = new Quote();

            var act = () => new QuoteProduct(quote, null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("product");
        }
    }
}
