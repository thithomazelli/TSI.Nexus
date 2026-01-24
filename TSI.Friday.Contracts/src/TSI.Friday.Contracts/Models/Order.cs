using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Order : BaseModel
    {
        private Client _client = null!;

        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public OrderStatus Status { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("Client")]
        public int ClientId { get; set; }

        [Required]
        public Client Client
        {
            get => _client;
            set { _client = value ?? throw new ArgumentNullException(nameof(Client)); }
        }

        public ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public Order() { }

        public Order(Client client)
        {
            Client = client ?? throw new ArgumentNullException(nameof(client));
        }
    }
}
