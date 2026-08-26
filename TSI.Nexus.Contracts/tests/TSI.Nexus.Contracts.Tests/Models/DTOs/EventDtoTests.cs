using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class EventDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var eventTypeOptionId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var vehicleMaintenanceId = Guid.NewGuid();
            var fuelLogId = Guid.NewGuid();
            var startDate = DateTime.UtcNow;
            var endDate = DateTime.UtcNow.AddHours(1);
            var participants = new List<EventParticipantDto> { new EventParticipantDto() };

            var dto = new EventDto
            {
                Id = id,
                Title = "Reunião",
                Description = "Reunião com cliente",
                StartDate = startDate,
                EndDate = endDate,
                EventTypeOptionId = eventTypeOptionId,
                EventTypeName = "Reunião",
                EventTypeColor = "#FF0000",
                CreatedByUserId = "user-1",
                CreatedByUserName = "John Doe",
                BusinessPartnerId = businessPartnerId,
                QuoteId = quoteId,
                OrderId = orderId,
                PurchaseOrderId = purchaseOrderId,
                TripId = tripId,
                TransactionId = transactionId,
                PaymentId = paymentId,
                VehicleId = vehicleId,
                DriverId = driverId,
                VehicleMaintenanceId = vehicleMaintenanceId,
                FuelLogId = fuelLogId,
                LinkedEntityType = "BusinessPartner",
                LinkedEntityLabel = "Cliente X",
                Participants = participants,
            };

            dto.Id.Should().Be(id);
            dto.Title.Should().Be("Reunião");
            dto.Description.Should().Be("Reunião com cliente");
            dto.StartDate.Should().Be(startDate);
            dto.EndDate.Should().Be(endDate);
            dto.EventTypeOptionId.Should().Be(eventTypeOptionId);
            dto.EventTypeName.Should().Be("Reunião");
            dto.EventTypeColor.Should().Be("#FF0000");
            dto.CreatedByUserId.Should().Be("user-1");
            dto.CreatedByUserName.Should().Be("John Doe");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.QuoteId.Should().Be(quoteId);
            dto.OrderId.Should().Be(orderId);
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.TripId.Should().Be(tripId);
            dto.TransactionId.Should().Be(transactionId);
            dto.PaymentId.Should().Be(paymentId);
            dto.VehicleId.Should().Be(vehicleId);
            dto.DriverId.Should().Be(driverId);
            dto.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            dto.FuelLogId.Should().Be(fuelLogId);
            dto.LinkedEntityType.Should().Be("BusinessPartner");
            dto.LinkedEntityLabel.Should().Be("Cliente X");
            dto.Participants.Should().BeSameAs(participants);
        }

        [Fact]
        public void Participants_DefaultsToEmptyCollection()
        {
            var dto = new EventDto();

            dto.Participants.Should().NotBeNull().And.BeEmpty();
        }
    }
}
