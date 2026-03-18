using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Transaction : BaseModel
    {
        public DateTime Date { get; set; }

        public string Description { get; set; }

        // Payments collection (persisted)
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        // Status of the transaction computed from its payments - do not persist to DB
        [NotMapped]
        public PaymentStatus Status { get; set; }

        public Guid? OrderId { get; set; }

        public Order Order { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }
    }
}
