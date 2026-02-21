using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }

        public PaymentType Type { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public PaymentCondition Condition { get; set; }

        public int TotalOfInstallments { get; set; }

        public decimal Price { get; set; }

        public PaymentMethod Method { get; set; }

        public PaymentStatus Status { get; set; }

        public ICollection<PaymentInstallmentDto> Installments { get; set; } =
            new List<PaymentInstallmentDto>();

        public int? OrderId { get; set; }

        public string OrderNumber { get; set; }

        public int? BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }
    }
}
