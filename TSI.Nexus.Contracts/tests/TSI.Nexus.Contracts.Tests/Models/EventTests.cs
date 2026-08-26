using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class EventTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var eventType = new SelectableOption();
            var createdByUser = new User();
            var businessPartner = new Individual();
            var quote = new Quote();
            var order = new Order();
            var purchaseOrder = new PurchaseOrder();
            var trip = new Trip();
            var transaction = new Transaction();
            var payment = new Payment();
            var vehicle = new Vehicle();
            var driver = new Driver();
            var vehicleMaintenance = new VehicleMaintenance();
            var fuelLog = new FuelLog();
            var participants = new List<EventParticipant> { new EventParticipant() };

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
            var endDate = DateTime.UtcNow.AddHours(2);

            var evt = new Event
            {
                Title = "Reunião",
                Description = "Reunião com cliente",
                StartDate = startDate,
                EndDate = endDate,
                EventTypeOptionId = eventTypeOptionId,
                EventType = eventType,
                CreatedByUserId = "user-1",
                CreatedByUser = createdByUser,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
                QuoteId = quoteId,
                Quote = quote,
                OrderId = orderId,
                Order = order,
                PurchaseOrderId = purchaseOrderId,
                PurchaseOrder = purchaseOrder,
                TripId = tripId,
                Trip = trip,
                TransactionId = transactionId,
                Transaction = transaction,
                PaymentId = paymentId,
                Payment = payment,
                VehicleId = vehicleId,
                Vehicle = vehicle,
                DriverId = driverId,
                Driver = driver,
                VehicleMaintenanceId = vehicleMaintenanceId,
                VehicleMaintenance = vehicleMaintenance,
                FuelLogId = fuelLogId,
                FuelLog = fuelLog,
                Participants = participants,
            };

            evt.Title.Should().Be("Reunião");
            evt.Description.Should().Be("Reunião com cliente");
            evt.StartDate.Should().Be(startDate);
            evt.EndDate.Should().Be(endDate);
            evt.EventTypeOptionId.Should().Be(eventTypeOptionId);
            evt.EventType.Should().BeSameAs(eventType);
            evt.CreatedByUserId.Should().Be("user-1");
            evt.CreatedByUser.Should().BeSameAs(createdByUser);
            evt.BusinessPartnerId.Should().Be(businessPartnerId);
            evt.BusinessPartner.Should().BeSameAs(businessPartner);
            evt.QuoteId.Should().Be(quoteId);
            evt.Quote.Should().BeSameAs(quote);
            evt.OrderId.Should().Be(orderId);
            evt.Order.Should().BeSameAs(order);
            evt.PurchaseOrderId.Should().Be(purchaseOrderId);
            evt.PurchaseOrder.Should().BeSameAs(purchaseOrder);
            evt.TripId.Should().Be(tripId);
            evt.Trip.Should().BeSameAs(trip);
            evt.TransactionId.Should().Be(transactionId);
            evt.Transaction.Should().BeSameAs(transaction);
            evt.PaymentId.Should().Be(paymentId);
            evt.Payment.Should().BeSameAs(payment);
            evt.VehicleId.Should().Be(vehicleId);
            evt.Vehicle.Should().BeSameAs(vehicle);
            evt.DriverId.Should().Be(driverId);
            evt.Driver.Should().BeSameAs(driver);
            evt.VehicleMaintenanceId.Should().Be(vehicleMaintenanceId);
            evt.VehicleMaintenance.Should().BeSameAs(vehicleMaintenance);
            evt.FuelLogId.Should().Be(fuelLogId);
            evt.FuelLog.Should().BeSameAs(fuelLog);
            evt.Participants.Should().BeSameAs(participants);
        }

        [Fact]
        public void DefaultConstructor_TitleDefaultsToEmptyAndParticipantsEmpty()
        {
            var evt = new Event();

            evt.Title.Should().BeEmpty();
            evt.CreatedByUserId.Should().BeEmpty();
            evt.Description.Should().BeNull();
            evt.Participants.Should().NotBeNull().And.BeEmpty();
        }
    }
}
