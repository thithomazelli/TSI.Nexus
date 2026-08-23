using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class FuelLog : BaseModel
    {
        public DateTime Date { get; set; }

        public int Odometer { get; set; }

        public decimal Liters { get; set; }

        public decimal PricePerLiter { get; set; }

        public decimal TotalCost { get; set; }

        public string GasStation { get; set; } = string.Empty;

        // Value comes from the SelectableOptionGroup.FuelLogStatus admin-editable list (same
        // mechanism as Address.Type/Product.Category) - not a C# enum, so a new status doesn't
        // require a code change.
        public string Status { get; set; } = string.Empty;

        [ForeignKey("Vehicle")]
        public Guid VehicleId { get; set; }

        // Not [Required]: the API only ever receives VehicleId from the client, never a nested
        // Vehicle object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since VehicleId is a non-nullable Guid.
        public virtual Vehicle Vehicle { get; set; } = null!;

        // Product consumed from the almoxarifado for this refueling - a single product (unlike
        // VehicleMaintenance's N-product grid), so it's a plain optional FK with the Sku/Name
        // denormalized directly onto the row (there's no DTO/AutoMapper layer for FuelLog to compute
        // them from the Product navigation on every read). The stock adjustment reuses
        // Product.QuantityInStock, triggered by a Status transition into "Concluído" (see
        // FuelLogStockAdjustingSaveChangesInterceptor).
        [ForeignKey("Product")]
        public Guid? ProductId { get; set; }

        public virtual Product? Product { get; set; }

        public string? ProductSku { get; set; }

        public string? ProductName { get; set; }

        public FuelLog() { }

        public FuelLog(Vehicle vehicle)
        {
            Vehicle = vehicle ?? throw new ArgumentNullException(nameof(vehicle));
            VehicleId = vehicle.Id;
        }
    }
}
