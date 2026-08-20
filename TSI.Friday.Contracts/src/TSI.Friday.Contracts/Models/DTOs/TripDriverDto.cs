using System;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class TripDriverDto
    {
        public Guid Id { get; set; }

        public decimal Amount { get; set; }

        public Guid TripId { get; set; }

        public string TripNumber { get; set; }

        public Guid DriverId { get; set; }

        public string DriverName { get; set; }

        public string DriverLicenseNumber { get; set; }

        public DateTime DriverLicenseExpiryDate { get; set; }

        public Guid? PaymentId { get; set; }
    }
}
