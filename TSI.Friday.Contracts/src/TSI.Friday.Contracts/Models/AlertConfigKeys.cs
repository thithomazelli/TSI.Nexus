namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// Known <see cref="AlertConfig.Key"/> values, so callers don't scatter magic strings.
    /// </summary>
    public static class AlertConfigKeys
    {
        /// <summary>Vehicle maintenance whose scheduled date has passed (blocks the vehicle).</summary>
        public const string VehicleMaintenanceOverdue = "VehicleMaintenanceOverdue";

        /// <summary>Rental returns/payments past their due date (dashboard "Devoluções em Atraso").</summary>
        public const string DashboardOverdueReturns = "DashboardOverdueReturns";

        /// <summary>Driver transport license expired or expiring within ThresholdDays.</summary>
        public const string DriverLicenseExpiry = "DriverLicenseExpiry";

        /// <summary>Events starting within ThresholdDays days (navbar bell + "meus eventos").</summary>
        public const string UpcomingEventReminder = "UpcomingEventReminder";
    }
}
