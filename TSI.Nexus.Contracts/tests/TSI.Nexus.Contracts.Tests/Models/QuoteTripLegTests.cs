using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class QuoteTripLegTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var quoteTrip = new QuoteTrip();
            var quoteTripId = Guid.NewGuid();
            var departureDate = DateTime.UtcNow;
            var arrivalDate = DateTime.UtcNow.AddHours(5);

            var leg = new QuoteTripLeg
            {
                SequenceNumber = 1,
                Origin = "SP",
                Destination = "RJ",
                DepartureDate = departureDate,
                ArrivalDate = arrivalDate,
                DistanceKm = 430m,
                Notes = "Direct route",
                QuoteTripId = quoteTripId,
                QuoteTrip = quoteTrip,
            };

            leg.SequenceNumber.Should().Be(1);
            leg.Origin.Should().Be("SP");
            leg.Destination.Should().Be("RJ");
            leg.DepartureDate.Should().Be(departureDate);
            leg.ArrivalDate.Should().Be(arrivalDate);
            leg.DistanceKm.Should().Be(430m);
            leg.Notes.Should().Be("Direct route");
            leg.QuoteTripId.Should().Be(quoteTripId);
            leg.QuoteTrip.Should().BeSameAs(quoteTrip);
        }

        [Fact]
        public void DefaultConstructor_LeavesOriginEmpty()
        {
            var leg = new QuoteTripLeg();

            leg.Origin.Should().BeEmpty();
            leg.Destination.Should().BeEmpty();
            leg.Notes.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsQuoteTripAndIdFromArgument()
        {
            var quoteTrip = new QuoteTrip { Id = Guid.NewGuid() };

            var leg = new QuoteTripLeg(quoteTrip);

            leg.QuoteTrip.Should().BeSameAs(quoteTrip);
            leg.QuoteTripId.Should().Be(quoteTrip.Id);
        }

        [Fact]
        public void Constructor_WithNullQuoteTrip_ThrowsArgumentNullException()
        {
            var act = () => new QuoteTripLeg(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("quoteTrip");
        }
    }
}
