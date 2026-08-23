using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PurchaseOrderProductDto
    {
        public Guid Id { get; set; }

        public string Description { get; set; }

        public decimal Quantity { get; set; }

        public decimal PreviousQuantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public Guid PurchaseOrderId { get; set; }

        public string PurchaseOrderNumber { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public Guid ProductId { get; set; }

        public string ProductName { get; set; }

        public string ProductSku { get; set; }

        public ProductType ProductType { get; set; }
    }
}
