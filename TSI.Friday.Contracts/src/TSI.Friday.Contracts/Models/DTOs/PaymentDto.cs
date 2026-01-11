using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public decimal Discount { get; set; }

        public decimal TotalPrice { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentType Type { get; set; }

        public int Installments { get; set; }

        public decimal TotalPerInstallment { get; set; }

        public int OrderId { get; set; }

        public int ClientId { get; set; }
    }
}
