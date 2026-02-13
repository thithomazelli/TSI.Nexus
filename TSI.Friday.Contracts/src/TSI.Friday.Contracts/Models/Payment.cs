using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Payment : BaseModel
    {
        private Order _order = null;
        private Client _client = null;

        public int Id { get; set; }

        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; }

        public DateTime Date { get; set; }

        public string Category { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public PaymentCondition Condition { get; set; }

        public ICollection<PaymentInstallment> Installments { get; set; }

        [ForeignKey("Order")]
        public int? OrderId { get; set; }

        public Order Order
        {
            get => _order;
            set { _order = value ?? throw new ArgumentNullException(nameof(Order)); }
        }

        [ForeignKey("Client")]
        public int? ClientId { get; set; }

        public Client Client
        {
            get => _client;
            set { _client = value ?? throw new ArgumentNullException(nameof(Client)); }
        }

        public Payment() { }

        public Payment(Order order, Client client)
        {
            Order = order ?? throw new ArgumentNullException(nameof(order));
            Client = client ?? throw new ArgumentNullException(nameof(client));
        }
    }
}
