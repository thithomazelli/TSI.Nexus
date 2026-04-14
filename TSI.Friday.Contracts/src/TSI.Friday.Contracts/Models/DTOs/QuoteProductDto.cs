using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class QuoteProductDto
    {
        public Guid Id { get; set; }

        public decimal Quantity { get; set; }

        public decimal PreviousQuantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public OrderProductStatus Status { get; set; }

        public Guid OrderId { get; set; }

        public string OrderNumber { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public Guid ProductId { get; set; }

        public string ProductName { get; set; }

        public string ProductSku { get; set; }

        public ProductType ProductType { get; set; }
    }
}
