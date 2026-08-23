using System;
using System.Collections.Generic;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class EventDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public Guid EventTypeOptionId { get; set; }

        public string EventTypeName { get; set; }

        public string EventTypeColor { get; set; }

        public string CreatedByUserId { get; set; }

        public string CreatedByUserName { get; set; }

        // --- Links --------------------------------------------------------------------------

        public Guid? BusinessPartnerId { get; set; }
        public Guid? QuoteId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public Guid? TripId { get; set; }
        public Guid? TransactionId { get; set; }
        public Guid? PaymentId { get; set; }
        public Guid? VehicleId { get; set; }
        public Guid? DriverId { get; set; }
        public Guid? VehicleMaintenanceId { get; set; }
        public Guid? FuelLogId { get; set; }

        // Computed: which of the FKs above is set ("BusinessPartner", "Order", ...) and its
        // human-readable label (BusinessPartner.Name, Order.OrderNumber, ...) - one pair covers
        // all eleven links so the grid/calendar only need a single "Vínculo" column.
        public string LinkedEntityType { get; set; }

        public string LinkedEntityLabel { get; set; }

        public ICollection<EventParticipantDto> Participants { get; set; } = [];
    }
}
