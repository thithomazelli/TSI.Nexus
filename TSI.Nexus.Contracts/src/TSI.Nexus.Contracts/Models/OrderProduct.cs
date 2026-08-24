using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class OrderProduct : BaseModel
    {
        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal TotalPrice { get; private set; }

        [ForeignKey("Order")]
        public Guid OrderId { get; set; }

        [Required]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        [Required]
        public virtual Product Product { get; set; } = null!;

        public OrderProduct() { }

        public OrderProduct(Order order, Product product)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            OrderId = order.Id;

            Product = product ?? throw new ArgumentNullException(nameof(product));
            ProductId = product.Id;
        }
    }
}
