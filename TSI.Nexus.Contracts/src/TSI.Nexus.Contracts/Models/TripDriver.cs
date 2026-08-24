using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    /// <summary>
    /// Links a Driver to a Trip. A Trip can now have any number of Drivers (it used to be a
    /// single Trip.DriverId), each with their own Amount to be paid - which is mirrored as an
    /// Outgoing Payment on the Trip's own Transaction (see TripDriverService).
    /// </summary>
    public class TripDriver : BaseModel
    {
        public decimal Amount { get; set; }

        [ForeignKey("Trip")]
        public Guid TripId { get; set; }

        public virtual Trip Trip { get; set; } = null!;

        [ForeignKey("Driver")]
        public Guid DriverId { get; set; }

        public virtual Driver Driver { get; set; } = null!;

        // The Outgoing Payment (expense) created for this driver's Amount, kept in sync on
        // Update/Remove.
        [ForeignKey("Payment")]
        public Guid? PaymentId { get; set; }

        public virtual Payment? Payment { get; set; }
    }
}
