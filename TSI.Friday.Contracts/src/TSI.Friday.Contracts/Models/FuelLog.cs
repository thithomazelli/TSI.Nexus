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

        [ForeignKey("Vehicle")]
        public Guid VehicleId { get; set; }

        // Not [Required]: the API only ever receives VehicleId from the client, never a nested
        // Vehicle object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since VehicleId is a non-nullable Guid.
        public virtual Vehicle Vehicle { get; set; } = null!;

        public FuelLog() { }

        public FuelLog(Vehicle vehicle)
        {
            Vehicle = vehicle ?? throw new ArgumentNullException(nameof(vehicle));
            VehicleId = vehicle.Id;
        }
    }
}
