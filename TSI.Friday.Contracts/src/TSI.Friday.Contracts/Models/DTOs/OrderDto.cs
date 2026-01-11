using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; }

        public OrderStatus Status { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public int ClientId { get; set; }

        public decimal TotalPrice { get; set; }
    }
}
