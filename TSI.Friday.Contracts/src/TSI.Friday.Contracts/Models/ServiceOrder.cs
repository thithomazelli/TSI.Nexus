using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class ServiceOrder : BaseModel
    {
        public string Number { get; set; } = string.Empty;

        public DateTime IssueDate { get; set; }

        public DateTime? CompletionDate { get; set; }

        public string Description { get; set; } = string.Empty;

        public ServiceOrderStatus Status { get; set; }

        [ForeignKey("Order")]
        public Guid OrderId { get; set; }

        [Required]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("Driver")]
        public Guid DriverId { get; set; }

        [Required]
        public virtual Driver Driver { get; set; } = null!;

        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }

        public virtual Vehicle? Vehicle { get; set; }

        public virtual Commission? Commission { get; set; }
    }
}
