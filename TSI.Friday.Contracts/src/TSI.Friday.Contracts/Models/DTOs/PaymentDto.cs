using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }

        public PaymentType Type { get; set; }

        public PaymentMethod Method { get; set; }

        public PaymentStatus Status { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public PaymentCondition Condition { get; set; }

        public int Installments { get; set; }

        public decimal PricePerInstallment { get; set; }

        public int? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public int? ClientId { get; set; }

        public string ClientName { get; set; }
    }
}
