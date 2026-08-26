using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class TripDriverDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var licenseExpiryDate = DateTime.UtcNow.AddYears(2);

            var dto = new TripDriverDto
            {
                Id = id,
                Amount = 250.75m,
                TripId = tripId,
                TripNumber = "TRIP-001",
                DriverId = driverId,
                DriverName = "Carlos",
                DriverLicenseNumber = "LIC-123",
                DriverLicenseExpiryDate = licenseExpiryDate,
                PaymentId = paymentId,
            };

            dto.Id.Should().Be(id);
            dto.Amount.Should().Be(250.75m);
            dto.TripId.Should().Be(tripId);
            dto.TripNumber.Should().Be("TRIP-001");
            dto.DriverId.Should().Be(driverId);
            dto.DriverName.Should().Be("Carlos");
            dto.DriverLicenseNumber.Should().Be("LIC-123");
            dto.DriverLicenseExpiryDate.Should().Be(licenseExpiryDate);
            dto.PaymentId.Should().Be(paymentId);
        }
    }
}
