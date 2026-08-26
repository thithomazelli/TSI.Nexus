using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class FuelLogTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var vehicle = new Vehicle();
            var product = new Product();
            var vehicleId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var date = DateTime.UtcNow;
            var events = new List<Event> { new Event() };

            var fuelLog = new FuelLog
            {
                Date = date,
                Odometer = 12000,
                Liters = 45.5m,
                PricePerLiter = 5.79m,
                TotalCost = 263.5m,
                GasStation = "Posto Central",
                Status = "Concluído",
                VehicleId = vehicleId,
                Vehicle = vehicle,
                ProductId = productId,
                Product = product,
                ProductSku = "SKU-1",
                ProductName = "Diesel",
                Events = events,
            };

            fuelLog.Date.Should().Be(date);
            fuelLog.Odometer.Should().Be(12000);
            fuelLog.Liters.Should().Be(45.5m);
            fuelLog.PricePerLiter.Should().Be(5.79m);
            fuelLog.TotalCost.Should().Be(263.5m);
            fuelLog.GasStation.Should().Be("Posto Central");
            fuelLog.Status.Should().Be("Concluído");
            fuelLog.VehicleId.Should().Be(vehicleId);
            fuelLog.Vehicle.Should().BeSameAs(vehicle);
            fuelLog.ProductId.Should().Be(productId);
            fuelLog.Product.Should().BeSameAs(product);
            fuelLog.ProductSku.Should().Be("SKU-1");
            fuelLog.ProductName.Should().Be("Diesel");
            fuelLog.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void DefaultConstructor_LeavesVehicleUnset()
        {
            var fuelLog = new FuelLog();

            fuelLog.GasStation.Should().BeEmpty();
            fuelLog.Status.Should().BeEmpty();
            fuelLog.Events.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void VehicleConstructor_SetsVehicleAndVehicleId()
        {
            var vehicle = new Vehicle { Id = Guid.NewGuid() };

            var fuelLog = new FuelLog(vehicle);

            fuelLog.Vehicle.Should().BeSameAs(vehicle);
            fuelLog.VehicleId.Should().Be(vehicle.Id);
        }

        [Fact]
        public void VehicleConstructor_WithNullVehicle_ThrowsArgumentNullException()
        {
            var act = () => new FuelLog(null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("vehicle");
        }
    }
}
