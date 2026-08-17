using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class TripLeg : BaseModel
    {
        public int SequenceNumber { get; set; }

        public string Origin { get; set; } = string.Empty;

        public string Destination { get; set; } = string.Empty;

        public DateTime DepartureDate { get; set; }

        public DateTime? ArrivalDate { get; set; }

        public decimal DistanceKm { get; set; }

        public string Notes { get; set; } = string.Empty;

        [ForeignKey("Trip")]
        public Guid TripId { get; set; }

        // Not [Required]: the API only ever receives TripId from the client, never a nested
        // Trip object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since TripId is a non-nullable Guid.
        public virtual Trip Trip { get; set; } = null!;

        public TripLeg() { }

        public TripLeg(Trip trip)
        {
            Trip = trip ?? throw new ArgumentNullException(nameof(trip));
            TripId = trip.Id;
        }
    }
}
