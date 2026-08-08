using System;
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

        // Optional part (Product) consumed from the almoxarifado for this maintenance. The stock
        // adjustment reuses the same QuantityInStock field already used for client orders, just
        // triggered by internal consumption instead of a sale/rental.
        [ForeignKey("Product")]
        public Guid? ProductId { get; set; }

        public virtual Product? Product { get; set; }

        public int PartQuantity { get; set; }

        public VehicleMaintenance() { }

        public VehicleMaintenance(Vehicle vehicle)
        {
            Vehicle = vehicle ?? throw new ArgumentNullException(nameof(vehicle));
            VehicleId = vehicle.Id;
        }
    }
}
