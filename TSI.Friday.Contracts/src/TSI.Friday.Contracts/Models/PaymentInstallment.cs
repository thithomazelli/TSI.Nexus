using System;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class PaymentInstallment : BaseModel
    {
        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentMethod Method { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int InstallmentNumber { get; set; }

        public decimal Price { get; set; }

        [ForeignKey("Payment")]
        public Guid PaymentId { get; set; }

        public Payment Payment { get; set; } = null!;

        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }

        [ForeignKey("Order")]
        public Guid? OrderId { get; set; }

        public Order Order { get; set; }
    }
}
