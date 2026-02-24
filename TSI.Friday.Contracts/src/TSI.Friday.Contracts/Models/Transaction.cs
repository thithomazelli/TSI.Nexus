using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Transaction : BaseModel
    {
        public TransactionType Type { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public TransactionCondition Condition { get; set; }

        public ICollection<Payment> Payments { get; set; } = [];

        public Guid? OrderId { get; set; }

        public Order Order { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }
    }
}
