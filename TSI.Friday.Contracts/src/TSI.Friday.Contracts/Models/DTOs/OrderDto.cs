using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; }

        public int BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public Payment Payment { get; set; }

        public ICollection<OrderProductDto> OrderProducts { get; set; } = [];
    }
}
