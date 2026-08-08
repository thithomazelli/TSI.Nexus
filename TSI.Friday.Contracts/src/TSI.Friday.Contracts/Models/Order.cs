using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Order : BaseModel
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string QuoteNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public OrderStatus Status { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }

        public Vehicle? Vehicle { get; set; }

        [ForeignKey("Driver")]
        public Guid? DriverId { get; set; }

        public Driver? Driver { get; set; }

        [ForeignKey("Transaction")]
        public Guid TransactionId { get; set; }

        public Transaction Transaction { get; set; } = null!;

        public ICollection<Payment>? Payments { get; set; } = [];

        public ICollection<OrderProduct> OrderProducts { get; set; } = [];

        public ICollection<TripLeg> TripLegs { get; set; } = [];

        public ICollection<Passenger> Passengers { get; set; } = [];

        public ICollection<Attachment> Attachments { get; set; }
    }
}
