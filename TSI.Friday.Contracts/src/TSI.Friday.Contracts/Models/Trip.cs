using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Trip : BaseModel
    {
        public string TripNumber { get; set; } = string.Empty;

        public string QuoteNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public OrderStatus Status { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public virtual BusinessPartner BusinessPartner { get; set; } = null!;

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

        [ForeignKey("Transaction")]
        public Guid TransactionId { get; set; }

        public virtual Transaction Transaction { get; set; } = null!;

        public virtual ICollection<Payment>? Payments { get; set; } = new List<Payment>();

        public virtual ICollection<TripLeg> TripLegs { get; set; } = new List<TripLeg>();

        public virtual ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();

        public virtual ICollection<Attachment> Attachments { get; set; }
    }
}
