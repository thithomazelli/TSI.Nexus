using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class TransactionDto
    {
        public Guid Id { get; set; }

        public DateTime CreateDate { get; set; }

        public string CreateUserId { get; set; }

        public DateTime ModifyDate { get; set; }

        public string ModifyUserId { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public int TotalOfPayments { get; set; }

        public decimal PaymentTotalPrice { get; set; }

        public int TotalOfExpenses { get; set; }

        public decimal ExpenseTotalPrice { get; set; }

        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentCondition Condition { get; set; }

        public PaymentMethod Method { get; set; }

        public Guid? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public Guid? TripId { get; set; }

        public string TripNumber { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public bool HasOpenedPayments { get; set; }

        public bool MarkAllPaymentsAsApproved { get; set; }

        // Payments in the transaction (optional, present when DTO includes them)
        public ICollection<PaymentDto> Payments { get; set; } = new List<PaymentDto>();
    }
}
