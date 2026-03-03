using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class TransactionDto
    {
        public Guid Id { get; set; }

        public TransactionType Type { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public TransactionCondition Condition { get; set; }

        public int TotalOfPayments { get; set; }

        public decimal Price { get; set; }

        public PaymentMethod Method { get; set; }

        public PaymentStatus Status { get; set; }

        public Guid? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public bool HasOpenedPayments { get; set; }

        public bool MarkAllPaymentsAsApproved { get; set; }
    }
}
