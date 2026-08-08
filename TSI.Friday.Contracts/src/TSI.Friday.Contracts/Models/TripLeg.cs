using System;
using System.ComponentModel.DataAnnotations;
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

        [Required]
        public virtual Order Order { get; set; } = null!;

        public TripLeg() { }

        public TripLeg(Order order)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            OrderId = order.Id;
        }
    }
}
