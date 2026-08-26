using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class PassengerTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var trip = new Trip();
            var tripId = Guid.NewGuid();

            var passenger = new Passenger
            {
                Name = "Maria",
                DocumentNumber = "123.456.789-00",
                Seat = "12A",
                Phone = "91234-5678",
                TripId = tripId,
                Trip = trip,
            };

            passenger.Name.Should().Be("Maria");
            passenger.DocumentNumber.Should().Be("123.456.789-00");
            passenger.Seat.Should().Be("12A");
            passenger.Phone.Should().Be("91234-5678");
            passenger.TripId.Should().Be(tripId);
            passenger.Trip.Should().BeSameAs(trip);
        }

        [Fact]
        public void DefaultConstructor_LeavesNameEmpty()
        {
            var passenger = new Passenger();

            passenger.Name.Should().BeEmpty();
            passenger.DocumentNumber.Should().BeEmpty();
            passenger.Seat.Should().BeEmpty();
            passenger.Phone.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsTripAndTripIdFromArgument()
        {
            var trip = new Trip { Id = Guid.NewGuid() };

            var passenger = new Passenger(trip);

            passenger.Trip.Should().BeSameAs(trip);
            passenger.TripId.Should().Be(trip.Id);
        }

        [Fact]
        public void Constructor_WithNullTrip_ThrowsArgumentNullException()
        {
            var act = () => new Passenger(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("trip");
        }
    }
}
