using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
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

        // Use DTO for installments to allow JSON binding
        public ICollection<PaymentInstallmentDto> Installments { get; set; } = [];

        public int? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public int? ClientId { get; set; }

        public string ClientName { get; set; }
    }
}
