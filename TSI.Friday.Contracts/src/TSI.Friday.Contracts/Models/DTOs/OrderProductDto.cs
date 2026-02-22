using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderProductDto
    {
        public Guid Id { get; set; }

        public string Description { get; set; }

        public decimal Quantity { get; set; }

        public decimal PreviousQuantity { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public OrderProductStatus Status { get; set; }

        public Guid OrderId { get; set; }

        public Guid AddressId { get; set; }

        public Address Address { get; set; }

        public string OrderNumber { get; set; }

        public Guid ProductId { get; set; }

        public string ProductName { get; set; }

        public string ProductSku { get; set; }

        public ProductType ProductType { get; set; }
    }
}
