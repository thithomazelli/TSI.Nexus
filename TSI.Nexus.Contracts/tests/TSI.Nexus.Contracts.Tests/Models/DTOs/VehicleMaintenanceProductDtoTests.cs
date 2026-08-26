using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class VehicleMaintenanceProductDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var vehicleMaintenanceId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var dto = new VehicleMaintenanceProductDto
            {
                Id = id,
                Description = "Filtro de óleo",
                Quantity = 1m,
                PreviousQuantity = 0m,
                Discount = 0m,
                Price = 45m,
                TotalPrice = 45m,
                VehicleMaintenanceId = vehicleMaintenanceId,
                VehicleId = vehicleId,
                VehiclePlate = "ABC-1234",
                ProductId = productId,
                ProductName = "Filtro",
                ProductSku = "SKU-1",
                ProductType = ProductType.Sale,
            };

            dto.Id.Should().Be(id);
            dto.Description.Should().Be("Filtro de óleo");
            dto.Quantity.Should().Be(1m);
            dto.PreviousQuantity.Should().Be(0m);
            dto.Discount.Should().Be(0m);
            dto.Price.Should().Be(45m);
            dto.TotalPrice.Should().Be(45m);
            dto.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            dto.VehicleId.Should().Be(vehicleId);
            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.ProductId.Should().Be(productId);
            dto.ProductName.Should().Be("Filtro");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Sale);
        }
    }
}
