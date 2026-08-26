using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class TripDriverTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var trip = new Trip();
            var driver = new Driver();
            var payment = new Payment();
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();

            var tripDriver = new TripDriver
            {
                Amount = 300m,
                TripId = tripId,
                Trip = trip,
                DriverId = driverId,
                Driver = driver,
                PaymentId = paymentId,
                Payment = payment,
            };

            tripDriver.Amount.Should().Be(300m);
            tripDriver.TripId.Should().Be(tripId);
            tripDriver.Trip.Should().BeSameAs(trip);
            tripDriver.DriverId.Should().Be(driverId);
            tripDriver.Driver.Should().BeSameAs(driver);
            tripDriver.PaymentId.Should().Be(paymentId);
            tripDriver.Payment.Should().BeSameAs(payment);
        }

        [Fact]
        public void PaymentId_DefaultsToNull()
        {
            var tripDriver = new TripDriver();

            tripDriver.PaymentId.Should().BeNull();
            tripDriver.Payment.Should().BeNull();
        }
    }
}
