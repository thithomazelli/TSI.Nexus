using System;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class PaymentInstallment : BaseModel
    {
        public int Id { get; set; }

        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentMethod Method { get; set; }

        public DateTime Date { get; set; }

        public string Description { get; set; }

        public int InstallmentNumber { get; set; }

        public decimal Price { get; set; }

        [ForeignKey("Payment")]
        public int PaymentId { get; set; }

        public Payment Payment { get; set; } = null!;

        [ForeignKey("Client")]
        public int? ClientId { get; set; }

        public Client Client { get; set; }

        [ForeignKey("Order")]
        public int? OrderId { get; set; }

        public Order Order { get; set; }
    }
}
