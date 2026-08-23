using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class VehicleMaintenance : BaseModel
    {
        public MaintenanceType Type { get; set; }

        public string Description { get; set; } = string.Empty;

        public DateTime ScheduledDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public int? OdometerAtService { get; set; }

        public decimal Cost { get; set; }

        public MaintenanceStatus Status { get; set; }

        [ForeignKey("Vehicle")]
        public Guid VehicleId { get; set; }

        // Not [Required]: the API only ever receives VehicleId from the client, never a nested
        // Vehicle object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since VehicleId is a non-nullable Guid.
        public virtual Vehicle Vehicle { get; set; } = null!;

        // Parts (Product) consumed from the almoxarifado for this maintenance - N products, staged
        // via the same app-product-picker-grid used by Pedido de Venda/Compra. The stock adjustment
        // reuses the same QuantityInStock field already used for client orders, just triggered by a
        // Status transition into Completed instead of a sale/rental line (see
        // MaintenancePartsStockAdjustingSaveChangesInterceptor).
        public ICollection<VehicleMaintenanceProduct> VehicleMaintenanceProducts { get; set; } = [];

        public VehicleMaintenance() { }

        public VehicleMaintenance(Vehicle vehicle)
        {
            Vehicle = vehicle ?? throw new ArgumentNullException(nameof(vehicle));
            VehicleId = vehicle.Id;
        }
    }
}
