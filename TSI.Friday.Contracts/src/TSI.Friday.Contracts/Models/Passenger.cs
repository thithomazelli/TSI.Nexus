using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class Passenger : BaseModel
    {
        public string Name { get; set; } = string.Empty;

        public string DocumentNumber { get; set; } = string.Empty;

        public string Seat { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        [ForeignKey("Order")]
        public Guid OrderId { get; set; }

        [Required]
        public virtual Order Order { get; set; } = null!;

        public Passenger() { }

        public Passenger(Order order)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            OrderId = order.Id;
        }
    }
}
