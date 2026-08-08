using System;
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

        // Not [Required]: the API only ever receives OrderId from the client, never a nested
        // Order object, and DataAnnotations validation would otherwise reject every request.
        // The relationship is still enforced at the DB level since OrderId is a non-nullable Guid.
        public virtual Order Order { get; set; } = null!;

        public Passenger() { }

        public Passenger(Order order)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            OrderId = order.Id;
        }
    }
}
