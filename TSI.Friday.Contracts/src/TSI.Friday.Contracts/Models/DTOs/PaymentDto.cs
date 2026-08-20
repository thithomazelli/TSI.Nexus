using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentDto
    {
        public Guid Id { get; set; }

        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentCondition Condition { get; set; }

        public PaymentMethod Method { get; set; }

        public string Category { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int PaymentNumber { get; set; }

        public decimal Price { get; set; }

        public Guid TransactionId { get; set; }

        public string TransactionDescription { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public BusinessPartnerType? BusinessPartnerType { get; set; }

        public Guid? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public Guid? TripId { get; set; }

        public string TripNumber { get; set; }

        public Guid? DriverId { get; set; }

        public string DriverName { get; set; }
    }
}
