using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class PurchaseOrderProduct : BaseModel
    {
        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal TotalPrice { get; private set; }

        [ForeignKey("PurchaseOrder")]
        public Guid PurchaseOrderId { get; set; }

        [Required]
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        [Required]
        public virtual Product Product { get; set; } = null!;

        public PurchaseOrderProduct() { }

        public PurchaseOrderProduct(PurchaseOrder purchaseOrder, Product product)
        {
            PurchaseOrder = purchaseOrder ?? throw new ArgumentNullException(nameof(purchaseOrder));
            PurchaseOrderId = purchaseOrder.Id;

            Product = product ?? throw new ArgumentNullException(nameof(product));
            ProductId = product.Id;
        }
    }
}
