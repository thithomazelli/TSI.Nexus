using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Quote : BaseModel
    {
        public string QuoteNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public QuoteStatus Status { get; set; }

        public QuoteType Type { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        public PaymentCondition Condition { get; set; }

        public PaymentMethod Method { get; set; }

        public int TotalOfPayments { get; set; }

        public decimal PaymentTotalPrice { get; set; }

        public int TotalOfExpenses { get; set; }

        public decimal ExpenseTotalPrice { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }

        public ICollection<QuoteProduct> QuoteProducts { get; set; } = [];

        public ICollection<Attachment> Attachments { get; set; }

        // Only populated when Type == QuoteType.Trip.
        public QuoteTrip QuoteTrip { get; set; }
    }
}
