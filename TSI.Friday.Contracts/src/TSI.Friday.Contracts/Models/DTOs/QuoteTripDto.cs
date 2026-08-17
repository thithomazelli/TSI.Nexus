using System;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class QuoteTripDto
    {
        public Guid Id { get; set; }

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        public Guid? VehicleId { get; set; }

        public string VehiclePlate { get; set; }

        public Guid? DriverId { get; set; }

        public string DriverName { get; set; }

        public Guid QuoteId { get; set; }
    }
}
