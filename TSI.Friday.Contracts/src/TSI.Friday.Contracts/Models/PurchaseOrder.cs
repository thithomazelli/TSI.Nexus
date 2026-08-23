using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class PurchaseOrder : BaseModel
    {
        public string PurchaseOrderNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public OrderStatus Status { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }

        [ForeignKey("Transaction")]
        public Guid TransactionId { get; set; }

        public Transaction Transaction { get; set; } = null!;

        public ICollection<Payment>? Payments { get; set; } = [];

        public ICollection<PurchaseOrderProduct> PurchaseOrderProducts { get; set; } = [];

        public ICollection<Attachment> Attachments { get; set; }
    }
}
