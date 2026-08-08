using System;
using System.ComponentModel.DataAnnotations;
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

        [Required]
        public virtual Vehicle Vehicle { get; set; } = null!;

        public VehicleMaintenance() { }

        public VehicleMaintenance(Vehicle vehicle)
        {
            Vehicle = vehicle ?? throw new ArgumentNullException(nameof(vehicle));
            VehicleId = vehicle.Id;
        }
    }
}
