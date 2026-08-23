using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PurchaseOrderDto
    {
        public Guid Id { get; set; }

        public string PurchaseOrderNumber { get; set; }

        public DateTime Date { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public DateTime CreateDate { get; set; }

        public string CreateUserId { get; set; }

        public DateTime ModifyDate { get; set; }

        public string ModifyUserId { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public Guid? TransactionId { get; set; }

        public TransactionDto? Transaction { get; set; }

        public ICollection<PurchaseOrderProductDto> PurchaseOrderProducts { get; set; } = [];
    }
}
