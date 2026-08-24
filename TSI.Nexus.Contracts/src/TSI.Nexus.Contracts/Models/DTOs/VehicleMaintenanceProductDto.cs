using System;
using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class VehicleMaintenanceProductDto
    {
        public Guid Id { get; set; }

        public string Description { get; set; }

        public decimal Quantity { get; set; }

        public decimal PreviousQuantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public Guid VehicleMaintenanceId { get; set; }

        public Guid VehicleId { get; set; }

        public string VehiclePlate { get; set; }

        public Guid ProductId { get; set; }

        public string ProductName { get; set; }

        public string ProductSku { get; set; }

        public ProductType ProductType { get; set; }
    }
}
