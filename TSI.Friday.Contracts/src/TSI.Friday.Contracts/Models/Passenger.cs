using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class Passenger : BaseModel
    {
        public string Name { get; set; } = string.Empty;

        public string DocumentNumber { get; set; } = string.Empty;

        public string Seat { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        [ForeignKey("Trip")]
        public Guid TripId { get; set; }

        // Not [Required]: the API only ever receives TripId from the client, never a nested
        // Trip object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since TripId is a non-nullable Guid.
        public virtual Trip Trip { get; set; } = null!;

        public Passenger() { }

        public Passenger(Trip trip)
        {
            Trip = trip ?? throw new ArgumentNullException(nameof(trip));
            TripId = trip.Id;
        }
    }
}
