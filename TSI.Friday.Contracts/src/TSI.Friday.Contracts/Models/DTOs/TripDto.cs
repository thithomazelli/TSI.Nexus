using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class TripDto
    {
        public Guid Id { get; set; }

        public string TripNumber { get; set; }

        public DateTime Date { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public DateTime CreateDate { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        public Guid? VehicleId { get; set; }

        public string? VehiclePlate { get; set; }

        public Guid? DriverId { get; set; }

        public string? DriverName { get; set; }

        public string? QuoteNumber { get; set; }

        public Guid? TransactionId { get; set; }

        public TransactionDto? Transaction { get; set; }
    }
}
