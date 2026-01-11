using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class OrderProduct : BaseModel
    {
        private Order _order = null;
        private Product _product = null;

        public int Id { get; set; }

        public string Description { get; set; }

        public decimal Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal Discount { get; set; }

        public decimal TotalPrice => (Price * Quantity) - ((Price * Quantity) * Discount / 100m);

        [ForeignKey("Order")]
        public int OrderId { get; set; }

        [Required]
        public Order Order
        {
            get => _order;
            set
            {
                _order = value ?? throw new ArgumentNullException(nameof(Order));
            }
        }

        [ForeignKey("Product")]
        public int ProductId { get; set; }

        [Required]
        public Product Product
        {
            get => _product;
            set
            {
                _product = value ?? throw new ArgumentNullException(nameof(Product));

                if (Price == 0m)
                {
                    Price = _product.Price;
                }
            }
        }

        public OrderProduct() { }

        public OrderProduct(Order order, Product product)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            Product = product ?? throw new ArgumentNullException(nameof(product));
            Price = product.Price;
        }
    }
}
