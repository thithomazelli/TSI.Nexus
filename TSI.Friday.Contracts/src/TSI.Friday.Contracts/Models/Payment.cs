using System;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Payment : BaseModel
    {
        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentCondition Condition { get; set; }

        public PaymentMethod Method { get; set; }

        public string Category { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int PaymentNumber { get; set; }

        public decimal Price { get; set; }

        [ForeignKey("Transaction")]
        public Guid TransactionId { get; set; }

        public Transaction Transaction { get; set; } = null!;

        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }

        public BusinessPartner? BusinessPartner { get; set; }

        [ForeignKey("Order")]
        public Guid? OrderId { get; set; }

        public Order Order { get; set; }
    }
}
