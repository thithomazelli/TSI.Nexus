using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class QuoteProduct : BaseModel
    {
        public decimal Quantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal TotalPrice { get; private set; }

        public OrderProductStatus Status { get; set; }

        [ForeignKey("Quote")]
        public Guid QuoteId { get; set; }

        [Required]
        public virtual Quote Quote { get; set; } = null!;

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        [Required]
        public virtual Product Product { get; set; } = null!;

        public QuoteProduct() { }

        public QuoteProduct(Quote quote, Product product)
        {
            Quote = quote ?? throw new ArgumentNullException(nameof(quote));
            QuoteId = quote.Id;

            Product = product ?? throw new ArgumentNullException(nameof(product));
            ProductId = product.Id;
        }
    }
}
