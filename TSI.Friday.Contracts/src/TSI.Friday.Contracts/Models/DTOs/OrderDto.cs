using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderDto
    {
        public Guid Id { get; set; }

        public string OrderNumber { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public DateTime CreateDate { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public Guid? TransactionId { get; set; }

        public TransactionDto Transaction { get; set; }

        public ICollection<OrderProductDto> OrderProducts { get; set; } = [];

        public bool HasOpenedProducts { get; set; }

        public bool MarkAllProductsAsReturned { get; set; }
    }
}
