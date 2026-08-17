using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class QuoteDto
    {
        public Guid Id { get; set; }

        public string QuoteNumber { get; set; }

        public DateTime CreateDate { get; set; }

        public DateTime Date { get; set; }

        public QuoteStatus Status { get; set; }

        public QuoteType Type { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        public PaymentCondition Condition { get; set; }

        public PaymentMethod Method { get; set; }

        public int TotalOfPayments { get; set; }

        public decimal PaymentTotalPrice { get; set; }

        public int TotalOfExpenses { get; set; }

        public decimal ExpenseTotalPrice { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public ICollection<QuoteProductDto> QuoteProducts { get; set; } = [];

        // Only populated when Type == QuoteType.Trip.
        public QuoteTripDto QuoteTrip { get; set; }
    }
}
