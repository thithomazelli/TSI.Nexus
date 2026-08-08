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

        [ForeignKey("Order")]
        public Guid OrderId { get; set; }

        // Not [Required]: the API only ever receives OrderId from the client, never a nested
        // Order object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since OrderId is a non-nullable Guid.
        public virtual Order Order { get; set; } = null!;

        public TripLeg() { }

        public TripLeg(Order order)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            OrderId = order.Id;
        }
    }
}
