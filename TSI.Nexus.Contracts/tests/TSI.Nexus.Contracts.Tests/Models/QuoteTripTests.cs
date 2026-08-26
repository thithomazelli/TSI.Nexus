using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class QuoteTripTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var vehicle = new Vehicle();
            var driver = new Driver();
            var quote = new Quote();
            var quoteTripLegs = new List<QuoteTripLeg> { new QuoteTripLeg() };
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var licenseExpiryDate = DateTime.UtcNow.AddYears(1);

            var quoteTrip = new QuoteTrip
            {
                Route = "SP -> RJ",
                DistanceKm = 450m,
                DailyCount = 2,
                TransportLicenseNumber = "TL-1",
                TransportLicenseExpiryDate = licenseExpiryDate,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                DriverId = driverId,
                Driver = driver,
                QuoteId = quoteId,
                Quote = quote,
                QuoteTripLegs = quoteTripLegs,
            };

            quoteTrip.Route.Should().Be("SP -> RJ");
            quoteTrip.DistanceKm.Should().Be(450m);
            quoteTrip.DailyCount.Should().Be(2);
            quoteTrip.TransportLicenseNumber.Should().Be("TL-1");
            quoteTrip.TransportLicenseExpiryDate.Should().Be(licenseExpiryDate);
            quoteTrip.VehicleId.Should().Be(vehicleId);
            quoteTrip.Vehicle.Should().BeSameAs(vehicle);
            quoteTrip.DriverId.Should().Be(driverId);
            quoteTrip.Driver.Should().BeSameAs(driver);
            quoteTrip.QuoteId.Should().Be(quoteId);
            quoteTrip.Quote.Should().BeSameAs(quote);
            quoteTrip.QuoteTripLegs.Should().BeSameAs(quoteTripLegs);
        }

        [Fact]
        public void DefaultConstructor_RouteDefaultsToEmpty()
        {
            var quoteTrip = new QuoteTrip();

            quoteTrip.Route.Should().BeEmpty();
            quoteTrip.QuoteTripLegs.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void Constructor_SetsQuoteAndQuoteIdFromArgument()
        {
            var quote = new Quote { Id = Guid.NewGuid() };

            var quoteTrip = new QuoteTrip(quote);

            quoteTrip.Quote.Should().BeSameAs(quote);
            quoteTrip.QuoteId.Should().Be(quote.Id);
        }

        [Fact]
        public void Constructor_WithNullQuote_ThrowsArgumentNullException()
        {
            var act = () => new QuoteTrip(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("quote");
        }
    }
}
