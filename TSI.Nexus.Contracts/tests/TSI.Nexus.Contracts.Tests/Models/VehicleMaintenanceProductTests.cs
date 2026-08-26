using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class VehicleMaintenanceProductTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var vehicleMaintenance = new VehicleMaintenance();
            var product = new Product();
            var vehicleMaintenanceId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var vehicleMaintenanceProduct = new VehicleMaintenanceProduct
            {
                Description = "Filtro de óleo",
                Quantity = 1m,
                Price = 45m,
                Discount = 0m,
                VehicleMaintenanceId = vehicleMaintenanceId,
                VehicleMaintenance = vehicleMaintenance,
                ProductId = productId,
                Product = product,
            };

            vehicleMaintenanceProduct.Description.Should().Be("Filtro de óleo");
            vehicleMaintenanceProduct.Quantity.Should().Be(1m);
            vehicleMaintenanceProduct.Price.Should().Be(45m);
            vehicleMaintenanceProduct.Discount.Should().Be(0m);
            vehicleMaintenanceProduct.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            vehicleMaintenanceProduct.VehicleMaintenance.Should().BeSameAs(vehicleMaintenance);
            vehicleMaintenanceProduct.ProductId.Should().Be(productId);
            vehicleMaintenanceProduct.Product.Should().BeSameAs(product);
            vehicleMaintenanceProduct.TotalPrice.Should().Be(0m);
        }

        [Fact]
        public void DefaultConstructor_LeavesDescriptionEmpty()
        {
            var vehicleMaintenanceProduct = new VehicleMaintenanceProduct();

            vehicleMaintenanceProduct.Description.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_SetsVehicleMaintenanceAndProductFromArguments()
        {
            var vehicleMaintenance = new VehicleMaintenance { Id = Guid.NewGuid() };
            var product = new Product { Id = Guid.NewGuid() };

            var vehicleMaintenanceProduct = new VehicleMaintenanceProduct(vehicleMaintenance, product);

            vehicleMaintenanceProduct.VehicleMaintenance.Should().BeSameAs(vehicleMaintenance);
            vehicleMaintenanceProduct.VehicleMaintenanceId.Should().Be(vehicleMaintenance.Id);
            vehicleMaintenanceProduct.Product.Should().BeSameAs(product);
            vehicleMaintenanceProduct.ProductId.Should().Be(product.Id);
        }

        [Fact]
        public void Constructor_WithNullVehicleMaintenance_ThrowsArgumentNullException()
        {
            var product = new Product();

            var act = () => new VehicleMaintenanceProduct(null!, product);

            act.Should().Throw<ArgumentNullException>().WithParameterName("vehicleMaintenance");
        }

        [Fact]
        public void Constructor_WithNullProduct_ThrowsArgumentNullException()
        {
            var vehicleMaintenance = new VehicleMaintenance();

            var act = () => new VehicleMaintenanceProduct(vehicleMaintenance, null!);

            act.Should().Throw<ArgumentNullException>().WithParameterName("product");
        }
    }
}
