using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PaymentInstallmentDto
    {
        public int Id { get; set; }

        public PaymentMethod Method { get; set; }

        public PaymentStatus Status { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int InstallmentNumber { get; set; }

        public decimal Price { get; set; }

        public int PaymentId { get; set; }

        public int? ClientId { get; set; }

        public string ClientName { get; set; }

        public int? OrderId { get; set; }

        public string OrderNumber { get; set; }
    }
}
