using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class OrderProduct : BaseModel
    {
        public int Id { get; set; }

        public string Description { get; set; } = string.Empty;

        public ProductType Type { get; set; }

        public decimal Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal Discount { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal TotalPrice { get; private set; }

        [ForeignKey("Order")]
        public int OrderId { get; set; }

        [Required]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("Product")]
        public int ProductId { get; set; }

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
