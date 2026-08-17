using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Vehicle : BaseModel
    {
        public string Plate { get; set; }

        public string Renavam { get; set; }

        public string Chassis { get; set; }

        public string Brand { get; set; }

        public string Model { get; set; }

        public int ManufactureYear { get; set; }

        public int ModelYear { get; set; }

        public int SeatCapacity { get; set; }

        public VehicleType Type { get; set; }

        public VehicleStatus Status { get; set; }

        public decimal PricePerKm { get; set; }

        public decimal DailyRate { get; set; }

        public int Odometer { get; set; }

        public string Photo { get; set; }

        public virtual ICollection<VehicleMaintenance> Maintenances { get; set; } =
            new List<VehicleMaintenance>();

        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();

        public virtual ICollection<FuelLog> FuelLogs { get; set; } = new List<FuelLog>();

        public ICollection<Attachment> Attachments { get; set; }
    }
}
