using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class QuoteTrip : BaseModel
    {
        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }

        public virtual Vehicle? Vehicle { get; set; }

        [ForeignKey("Driver")]
        public Guid? DriverId { get; set; }

        public virtual Driver? Driver { get; set; }

        [ForeignKey("Quote")]
        public Guid QuoteId { get; set; }

        // Not [Required]: the API only ever receives QuoteId from the client, never a nested
        // Quote object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since QuoteId is a non-nullable Guid.
        public virtual Quote Quote { get; set; } = null!;

        public QuoteTrip() { }

        public QuoteTrip(Quote quote)
        {
            Quote = quote ?? throw new ArgumentNullException(nameof(quote));
            QuoteId = quote.Id;
        }
    }
}
