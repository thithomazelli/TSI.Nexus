using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Commission : BaseModel
    {
        public decimal Percentage { get; set; }

        public decimal BaseAmount { get; set; }

        public decimal Amount { get; set; }

        public CommissionStatus Status { get; set; }

        public DateTime? PaidDate { get; set; }

        [ForeignKey("ServiceOrder")]
        public Guid ServiceOrderId { get; set; }

        [Required]
        public virtual ServiceOrder ServiceOrder { get; set; } = null!;

        [ForeignKey("Driver")]
        public Guid DriverId { get; set; }

        [Required]
        public virtual Driver Driver { get; set; } = null!;
    }
}
