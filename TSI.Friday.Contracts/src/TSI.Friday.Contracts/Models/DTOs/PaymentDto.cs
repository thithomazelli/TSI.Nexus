using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentDto
    {
        public Guid Id { get; set; }

        public TransactionType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentMethod Method { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int InstallmentNumber { get; set; }

        public decimal Price { get; set; }

        public Guid TransactionId { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public Guid? OrderId { get; set; }

        public string OrderNumber { get; set; }
    }
}
