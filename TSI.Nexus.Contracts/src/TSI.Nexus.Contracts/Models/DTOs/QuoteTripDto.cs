using System;

namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class QuoteTripDto
    {
        // Nullable: a new (not-yet-persisted) QuoteTrip is sent by the client with Id null - a
        // non-nullable Guid here fails System.Text.Json deserialization outright (before model
        // binding even runs), blocking every new Orçamento de Viagem from ever being created.
        public Guid? Id { get; set; }

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        public Guid? VehicleId { get; set; }

        public string VehiclePlate { get; set; }

        public Guid? DriverId { get; set; }

        public string DriverName { get; set; }

        // Nullable for the same reason as Id above: a new QuoteTrip has no Quote yet, so the
        // client sends null - the server always overwrites this from the just-saved Quote's own
        // Id anyway (see QuoteService.Add/Update), so this field is effectively write-only inbound.
        public Guid? QuoteId { get; set; }
    }
}
