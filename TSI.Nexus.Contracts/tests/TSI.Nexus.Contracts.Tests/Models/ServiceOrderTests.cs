using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class ServiceOrderTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var trip = new Trip();
            var driver = new Driver();
            var vehicle = new Vehicle();
            var commission = new Commission();
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var issueDate = DateTime.UtcNow;
            var completionDate = DateTime.UtcNow.AddDays(1);

            var serviceOrder = new ServiceOrder
            {
                Number = "SO-001",
                IssueDate = issueDate,
                CompletionDate = completionDate,
                Description = "Viagem executiva",
                Status = ServiceOrderStatus.Completed,
                TripId = tripId,
                Trip = trip,
                DriverId = driverId,
                Driver = driver,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                Commission = commission,
            };

            serviceOrder.Number.Should().Be("SO-001");
            serviceOrder.IssueDate.Should().Be(issueDate);
            serviceOrder.CompletionDate.Should().Be(completionDate);
            serviceOrder.Description.Should().Be("Viagem executiva");
            serviceOrder.Status.Should().Be(ServiceOrderStatus.Completed);
            serviceOrder.TripId.Should().Be(tripId);
            serviceOrder.Trip.Should().BeSameAs(trip);
            serviceOrder.DriverId.Should().Be(driverId);
            serviceOrder.Driver.Should().BeSameAs(driver);
            serviceOrder.VehicleId.Should().Be(vehicleId);
            serviceOrder.Vehicle.Should().BeSameAs(vehicle);
            serviceOrder.Commission.Should().BeSameAs(commission);
        }

        [Fact]
        public void DefaultConstructor_LeavesNumberEmpty()
        {
            var serviceOrder = new ServiceOrder();

            serviceOrder.Number.Should().BeEmpty();
            serviceOrder.Description.Should().BeEmpty();
            serviceOrder.VehicleId.Should().BeNull();
            serviceOrder.Vehicle.Should().BeNull();
            serviceOrder.Commission.Should().BeNull();
        }
    }
}
