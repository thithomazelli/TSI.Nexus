using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class TripTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var vehicle = new Vehicle();
            var driver = new Driver();
            var transaction = new Transaction();
            var tripDrivers = new List<TripDriver> { new TripDriver() };
            var payments = new List<Payment> { new Payment() };
            var tripLegs = new List<TripLeg> { new TripLeg() };
            var passengers = new List<Passenger> { new Passenger() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };
            var businessPartnerId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var date = DateTime.UtcNow;
            var licenseExpiryDate = DateTime.UtcNow.AddYears(1);

            var trip = new Trip
            {
                TripNumber = "TRIP-001",
                QuoteNumber = "QUO-001",
                Date = date,
                Status = OrderStatus.Open,
                Price = 1500m,
                TotalPrice = 1400m,
                Discount = 100m,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                Route = "SP -> RJ",
                DistanceKm = 450m,
                DailyCount = 2,
                TransportLicenseNumber = "TL-1",
                TransportLicenseExpiryDate = licenseExpiryDate,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                DriverId = driverId,
                Driver = driver,
                TripDrivers = tripDrivers,
                TransactionId = transactionId,
                Transaction = transaction,
                Payments = payments,
                TripLegs = tripLegs,
                Passengers = passengers,
                Attachments = attachments,
                Events = events,
            };

            trip.TripNumber.Should().Be("TRIP-001");
            trip.QuoteNumber.Should().Be("QUO-001");
            trip.Date.Should().Be(date);
            trip.Status.Should().Be(OrderStatus.Open);
            trip.Price.Should().Be(1500m);
            trip.TotalPrice.Should().Be(1400m);
            trip.Discount.Should().Be(100m);
            trip.BusinessPartnerId.Should().Be(businessPartnerId);
            trip.BusinessPartner.Should().BeSameAs(businessPartner);
            trip.Route.Should().Be("SP -> RJ");
            trip.DistanceKm.Should().Be(450m);
            trip.DailyCount.Should().Be(2);
            trip.TransportLicenseNumber.Should().Be("TL-1");
            trip.TransportLicenseExpiryDate.Should().Be(licenseExpiryDate);
            trip.VehicleId.Should().Be(vehicleId);
            trip.Vehicle.Should().BeSameAs(vehicle);
            trip.DriverId.Should().Be(driverId);
            trip.Driver.Should().BeSameAs(driver);
            trip.TripDrivers.Should().BeSameAs(tripDrivers);
            trip.TransactionId.Should().Be(transactionId);
            trip.Transaction.Should().BeSameAs(transaction);
            trip.Payments.Should().BeSameAs(payments);
            trip.TripLegs.Should().BeSameAs(tripLegs);
            trip.Passengers.Should().BeSameAs(passengers);
            trip.Attachments.Should().BeSameAs(attachments);
            trip.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void CollectionProperties_DefaultToEmptyCollections()
        {
            var trip = new Trip();

            trip.TripNumber.Should().BeEmpty();
            trip.QuoteNumber.Should().BeEmpty();
            trip.Route.Should().BeEmpty();
            trip.TripDrivers.Should().NotBeNull().And.BeEmpty();
            trip.Payments.Should().NotBeNull().And.BeEmpty();
            trip.TripLegs.Should().NotBeNull().And.BeEmpty();
            trip.Passengers.Should().NotBeNull().And.BeEmpty();
        }
    }
}
