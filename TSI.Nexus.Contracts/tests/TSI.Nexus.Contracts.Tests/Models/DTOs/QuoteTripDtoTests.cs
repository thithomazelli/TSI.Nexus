using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class QuoteTripDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var licenseExpiryDate = DateTime.UtcNow.AddYears(1);

            var dto = new QuoteTripDto
            {
                Id = id,
                Route = "SP -> RJ",
                DistanceKm = 450m,
                DailyCount = 2,
                TransportLicenseNumber = "TL-1",
                TransportLicenseExpiryDate = licenseExpiryDate,
                VehicleId = vehicleId,
                VehiclePlate = "ABC-1234",
                DriverId = driverId,
                DriverName = "Carlos",
                QuoteId = quoteId,
            };

            dto.Id.Should().Be(id);
            dto.Route.Should().Be("SP -> RJ");
            dto.DistanceKm.Should().Be(450m);
            dto.DailyCount.Should().Be(2);
            dto.TransportLicenseNumber.Should().Be("TL-1");
            dto.TransportLicenseExpiryDate.Should().Be(licenseExpiryDate);
            dto.VehicleId.Should().Be(vehicleId);
            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.DriverId.Should().Be(driverId);
            dto.DriverName.Should().Be("Carlos");
            dto.QuoteId.Should().Be(quoteId);
        }

        [Fact]
        public void DefaultValues_RouteDefaultsToEmptyAndIdsAreNull()
        {
            var dto = new QuoteTripDto();

            dto.Route.Should().BeEmpty();
            dto.Id.Should().BeNull();
            dto.QuoteId.Should().BeNull();
        }
    }
}
