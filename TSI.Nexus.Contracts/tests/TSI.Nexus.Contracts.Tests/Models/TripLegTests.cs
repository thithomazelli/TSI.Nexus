using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class TripLegTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var trip = new Trip();
            var tripId = Guid.NewGuid();
            var departureDate = DateTime.UtcNow;
            var arrivalDate = DateTime.UtcNow.AddHours(6);

            var leg = new TripLeg
            {
                SequenceNumber = 2,
                Origin = "RJ",
                Destination = "MG",
                DepartureDate = departureDate,
                ArrivalDate = arrivalDate,
                DistanceKm = 350m,
                Notes = "Scenic route",
                TripId = tripId,
                Trip = trip,
            };

            leg.SequenceNumber.Should().Be(2);
            leg.Origin.Should().Be("RJ");
            leg.Destination.Should().Be("MG");
            leg.DepartureDate.Should().Be(departureDate);
            leg.ArrivalDate.Should().Be(arrivalDate);
            leg.DistanceKm.Should().Be(350m);
            leg.Notes.Should().Be("Scenic route");
            leg.TripId.Should().Be(tripId);
            leg.Trip.Should().BeSameAs(trip);
        }

        [Fact]
        public void DefaultConstructor_LeavesOriginEmpty()
        {
            var leg = new TripLeg();

            leg.Origin.Should().BeEmpty();
            leg.Destination.Should().BeEmpty();
            leg.Notes.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsTripAndTripIdFromArgument()
        {
            var trip = new Trip { Id = Guid.NewGuid() };

            var leg = new TripLeg(trip);

            leg.Trip.Should().BeSameAs(trip);
            leg.TripId.Should().Be(trip.Id);
        }

        [Fact]
        public void Constructor_WithNullTrip_ThrowsArgumentNullException()
        {
            var act = () => new TripLeg(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("trip");
        }
    }
}
