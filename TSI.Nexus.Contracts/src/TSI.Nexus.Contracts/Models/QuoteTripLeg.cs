using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class QuoteTripLeg : BaseModel
    {
        public int SequenceNumber { get; set; }

        public string Origin { get; set; } = string.Empty;

        public string Destination { get; set; } = string.Empty;

        public DateTime DepartureDate { get; set; }

        public DateTime? ArrivalDate { get; set; }

        public decimal DistanceKm { get; set; }

        public string Notes { get; set; } = string.Empty;

        [ForeignKey("QuoteTrip")]
        public Guid QuoteTripId { get; set; }

        // Not [Required]: the API only ever receives QuoteTripId from the client, never a nested
        // QuoteTrip object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since QuoteTripId is a non-nullable Guid.
        public virtual QuoteTrip QuoteTrip { get; set; } = null!;

        public QuoteTripLeg() { }

        public QuoteTripLeg(QuoteTrip quoteTrip)
        {
            QuoteTrip = quoteTrip ?? throw new ArgumentNullException(nameof(quoteTrip));
            QuoteTripId = quoteTrip.Id;
        }
    }
}
