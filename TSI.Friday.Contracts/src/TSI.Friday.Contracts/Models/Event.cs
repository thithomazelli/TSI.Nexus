using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// A calendar event, optionally linked to any of the entities below (at least one link is
    /// required - enforced in EventService.Add/Update, not a DB constraint, since it's an
    /// "at least one of eleven" rule rather than a single required field). Mirrors Attachment's
    /// shape: one nullable FK column per linkable entity, not polymorphic.
    /// </summary>
    public class Event : BaseModel
    {
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        [ForeignKey("EventType")]
        public Guid EventTypeOptionId { get; set; }

        public virtual SelectableOption EventType { get; set; } = null!;

        // Who created the event - set automatically from the logged-in user, not user-editable.
        public string CreatedByUserId { get; set; } = string.Empty;

        public virtual User CreatedByUser { get; set; } = null!;

        // --- Links to other entities: one nullable FK per entity, at least one required. -------

        [ForeignKey("BusinessPartner")]
        public Guid? BusinessPartnerId { get; set; }
        public virtual BusinessPartner? BusinessPartner { get; set; }

        [ForeignKey("Quote")]
        public Guid? QuoteId { get; set; }
        public virtual Quote? Quote { get; set; }

        [ForeignKey("Order")]
        public Guid? OrderId { get; set; }
        public virtual Order? Order { get; set; }

        [ForeignKey("PurchaseOrder")]
        public Guid? PurchaseOrderId { get; set; }
        public virtual PurchaseOrder? PurchaseOrder { get; set; }

        [ForeignKey("Trip")]
        public Guid? TripId { get; set; }
        public virtual Trip? Trip { get; set; }

        [ForeignKey("Transaction")]
        public Guid? TransactionId { get; set; }
        public virtual Transaction? Transaction { get; set; }

        [ForeignKey("Payment")]
        public Guid? PaymentId { get; set; }
        public virtual Payment? Payment { get; set; }

        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }
        public virtual Vehicle? Vehicle { get; set; }

        [ForeignKey("Driver")]
        public Guid? DriverId { get; set; }
        public virtual Driver? Driver { get; set; }

        [ForeignKey("VehicleMaintenance")]
        public Guid? VehicleMaintenanceId { get; set; }
        public virtual VehicleMaintenance? VehicleMaintenance { get; set; }

        [ForeignKey("FuelLog")]
        public Guid? FuelLogId { get; set; }
        public virtual FuelLog? FuelLog { get; set; }

        public virtual ICollection<EventParticipant> Participants { get; set; } = [];
    }
}
