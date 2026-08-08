using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderDto
    {
        public Guid Id { get; set; }

        public string OrderNumber { get; set; }

        public DateTime Date { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public DateTime CreateDate { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public Guid? VehicleId { get; set; }

        public string? VehiclePlate { get; set; }

        public Guid? DriverId { get; set; }

        public string? DriverName { get; set; }

        public Guid? QuoteId { get; set; }

        public string? QuoteNumber { get; set; }

        public Guid? TransactionId { get; set; }

        public TransactionDto? Transaction { get; set; }

        public ICollection<OrderProductDto> OrderProducts { get; set; } = [];

        public bool HasOpenedProducts { get; set; }

        public bool MarkAllProductsAsReturned { get; set; }
    }
}
