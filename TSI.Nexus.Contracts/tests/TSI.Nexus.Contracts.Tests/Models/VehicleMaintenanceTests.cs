using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class VehicleMaintenanceTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var vehicle = new Vehicle();
            var vehicleId = Guid.NewGuid();
            var scheduledDate = DateTime.UtcNow.AddDays(5);
            var completedDate = DateTime.UtcNow;
            var products = new List<VehicleMaintenanceProduct> { new VehicleMaintenanceProduct() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };

            var maintenance = new VehicleMaintenance
            {
                Type = MaintenanceType.Preventive,
                Description = "Troca de óleo",
                ScheduledDate = scheduledDate,
                CompletedDate = completedDate,
                OdometerAtService = 15000,
                Cost = 350m,
                Status = MaintenanceStatus.Completed,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                VehicleMaintenanceProducts = products,
                Attachments = attachments,
                Events = events,
            };

            maintenance.Type.Should().Be(MaintenanceType.Preventive);
            maintenance.Description.Should().Be("Troca de óleo");
            maintenance.ScheduledDate.Should().Be(scheduledDate);
            maintenance.CompletedDate.Should().Be(completedDate);
            maintenance.OdometerAtService.Should().Be(15000);
            maintenance.Cost.Should().Be(350m);
            maintenance.Status.Should().Be(MaintenanceStatus.Completed);
            maintenance.VehicleId.Should().Be(vehicleId);
            maintenance.Vehicle.Should().BeSameAs(vehicle);
            maintenance.VehicleMaintenanceProducts.Should().BeSameAs(products);
            maintenance.Attachments.Should().BeSameAs(attachments);
            maintenance.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void DefaultConstructor_CollectionsDefaultToEmpty()
        {
            var maintenance = new VehicleMaintenance();

            maintenance.Description.Should().BeEmpty();
            maintenance.VehicleMaintenanceProducts.Should().NotBeNull().And.BeEmpty();
            maintenance.Attachments.Should().NotBeNull().And.BeEmpty();
            maintenance.Events.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void Constructor_SetsVehicleAndVehicleIdFromArgument()
        {
            var vehicle = new Vehicle { Id = Guid.NewGuid() };

            var maintenance = new VehicleMaintenance(vehicle);

            maintenance.Vehicle.Should().BeSameAs(vehicle);
            maintenance.VehicleId.Should().Be(vehicle.Id);
        }

        [Fact]
        public void Constructor_WithNullVehicle_ThrowsArgumentNullException()
        {
            var act = () => new VehicleMaintenance(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("vehicle");
        }
    }
}
