namespace TSI.Nexus.Contracts.Models
{
    /// <summary>
    /// Known <see cref="FeatureToggle.Key"/> values, so callers don't scatter magic strings.
    /// Two kinds of key: group keys (control a whole area of the system) and entity keys (control
    /// one entity within a group, for finer-grained control). A record is only shown when BOTH its
    /// entity toggle and its group toggle are enabled (see <see cref="IFeatureToggleService"/>).
    /// </summary>
    public static class FeatureToggleKeys
    {
        // --- Groups ---------------------------------------------------------------------------

        /// <summary>
        /// Gates the whole fleet/trip module: Trip, TripLeg, Passenger, Driver, Vehicle, FuelLog,
        /// VehicleMaintenance, ServiceOrder, Commission, and Quotes of type Trip.
        /// </summary>
        public const string FleetModule = "FleetModule";

        /// <summary>Gates Transactions and Payments.</summary>
        public const string FinanceModule = "FinanceModule";

        /// <summary>Gates Quotes of type Product.</summary>
        public const string QuotesModule = "QuotesModule";

        /// <summary>Gates Sales Orders (Order, OrderProduct).</summary>
        public const string SalesOrdersModule = "SalesOrdersModule";

        /// <summary>Gates Purchase Orders (PurchaseOrder, PurchaseOrderProduct).</summary>
        public const string PurchaseOrdersModule = "PurchaseOrdersModule";

        /// <summary>Gates Attachments.</summary>
        public const string AttachmentsModule = "AttachmentsModule";

        /// <summary>Gates the whole Agenda/Calendário module: the standalone screen, the Agenda
        /// tab on every linkable entity, and the upcoming-events navbar bell.</summary>
        public const string AgendaModule = "AgendaModule";

        // --- Entities (Fleet/Viagens group) ----------------------------------------------------

        public const string Trip = "Trip";
        public const string TripLeg = "TripLeg";
        public const string Passenger = "Passenger";
        public const string Driver = "Driver";
        public const string Vehicle = "Vehicle";
        public const string FuelLog = "FuelLog";
        public const string VehicleMaintenance = "VehicleMaintenance";
        public const string ServiceOrder = "ServiceOrder";
        public const string Commission = "Commission";

        /// <summary>Gates the driver-license-expiring notification bell in the navbar.</summary>
        public const string DriverLicenseAlert = "DriverLicenseAlert";

        /// <summary>Gates the blocked-vehicles notification bell in the navbar.</summary>
        public const string VehicleBlockedAlert = "VehicleBlockedAlert";

        // --- Entities (Financeiro/Relatórios group) --------------------------------------------

        public const string Transaction = "Transaction";
        public const string Payment = "Payment";

        /// <summary>Gates the delayed/pending payments notification bell in the navbar.</summary>
        public const string PaymentAlert = "PaymentAlert";

        // --- Entities (Orçamentos group) --------------------------------------------------------

        public const string Quote = "Quote";

        // --- Entities (Pedidos de Venda group) --------------------------------------------------

        public const string Order = "Order";
        public const string OrderProduct = "OrderProduct";

        // --- Entities (Pedidos de Compra group) -------------------------------------------------

        public const string PurchaseOrder = "PurchaseOrder";

        /// <summary>Gates the out-of-stock/low-stock notification bell in the navbar.</summary>
        public const string StockAlert = "StockAlert";

        // --- Entities (Anexos group) -------------------------------------------------------------

        public const string Attachment = "Attachment";

        // --- Entities (Agenda group) --------------------------------------------------------------

        public const string Event = "Event";

        /// <summary>Gates the upcoming-events notification bell in the navbar.</summary>
        public const string UpcomingEventAlert = "UpcomingEventAlert";
    }
}
