using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Order : BaseModel
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public OrderStatus Status { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("BusinessPartner")]
        public int BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }

        [ForeignKey("Payment")]
        public int PaymentId { get; set; }

        public Payment Payment { get; set; }

        public ICollection<OrderProduct> OrderProducts { get; set; } = [];
    }
}
