using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class VehicleTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var maintenances = new List<VehicleMaintenance> { new VehicleMaintenance() };
            var trips = new List<Trip> { new Trip() };
            var fuelLogs = new List<FuelLog> { new FuelLog() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };

            var vehicle = new Vehicle
            {
                Plate = "ABC-1234",
                Renavam = "123456789",
                Chassis = "CHASSIS-1",
                Brand = "Mercedes",
                Model = "Sprinter",
                ManufactureYear = 2020,
                ModelYear = 2021,
                SeatCapacity = 20,
                Type = VehicleType.Van,
                Status = VehicleStatus.Available,
                PricePerKm = 3.5m,
                DailyRate = 500m,
                Odometer = 15000,
                Photo = "photo.png",
                Maintenances = maintenances,
                Trips = trips,
                FuelLogs = fuelLogs,
                Attachments = attachments,
                Events = events,
            };

            vehicle.Plate.Should().Be("ABC-1234");
            vehicle.Renavam.Should().Be("123456789");
            vehicle.Chassis.Should().Be("CHASSIS-1");
            vehicle.Brand.Should().Be("Mercedes");
            vehicle.Model.Should().Be("Sprinter");
            vehicle.ManufactureYear.Should().Be(2020);
            vehicle.ModelYear.Should().Be(2021);
            vehicle.SeatCapacity.Should().Be(20);
            vehicle.Type.Should().Be(VehicleType.Van);
            vehicle.Status.Should().Be(VehicleStatus.Available);
            vehicle.PricePerKm.Should().Be(3.5m);
            vehicle.DailyRate.Should().Be(500m);
            vehicle.Odometer.Should().Be(15000);
            vehicle.Photo.Should().Be("photo.png");
            vehicle.Maintenances.Should().BeSameAs(maintenances);
            vehicle.Trips.Should().BeSameAs(trips);
            vehicle.FuelLogs.Should().BeSameAs(fuelLogs);
            vehicle.Attachments.Should().BeSameAs(attachments);
            vehicle.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void CollectionProperties_DefaultToEmptyCollections()
        {
            var vehicle = new Vehicle();

            vehicle.Maintenances.Should().NotBeNull().And.BeEmpty();
            vehicle.Trips.Should().NotBeNull().And.BeEmpty();
            vehicle.FuelLogs.Should().NotBeNull().And.BeEmpty();
        }
    }
}
