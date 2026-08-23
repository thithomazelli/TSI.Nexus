using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class Attachment : BaseModel
    {
        public string FileName { get; set; } = string.Empty;

        // Relative or absolute path where file is stored
        public string Path { get; set; } = string.Empty;

        // Optional link to BusinessPartner
        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }
        public BusinessPartner? BusinessPartner { get; set; }

        // Optional link to Quote
        [ForeignKey("Quote")]
        public Guid? QuoteId { get; set; }
        public Quote? Quote { get; set; }

        // Optional link to Order
        [ForeignKey("Order")]
        public Guid? OrderId { get; set; }
        public Order? Order { get; set; }

        // Optional link to PurchaseOrder
        [ForeignKey("PurchaseOrder")]
        public Guid? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        // Optional link to Trip
        [ForeignKey("Trip")]
        public Guid? TripId { get; set; }
        public Trip? Trip { get; set; }

        // Optional link to Transaction
        [ForeignKey("Transaction")]
        public Guid? TransactionId { get; set; }
        public Transaction? Transaction { get; set; }

        // Optional link to Payment
        [ForeignKey("Payment")]
        public Guid? PaymentId { get; set; }
        public Payment? Payment { get; set; }

        // Optional link to Product
        [ForeignKey("Product")]
        public Guid? ProductId { get; set; }
        public Product? Product { get; set; }

        // Optional link to Vehicle
        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        // Optional link to Driver
        [ForeignKey("Driver")]
        public Guid? DriverId { get; set; }
        public Driver? Driver { get; set; }

        // Optional link to User
        public string UserId { get; set; }
        public User? User { get; set; }
    }
}
