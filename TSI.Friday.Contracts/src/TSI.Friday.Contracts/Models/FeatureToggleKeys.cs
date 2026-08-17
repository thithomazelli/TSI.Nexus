namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// Known <see cref="FeatureToggle.Key"/> values, so callers don't scatter magic strings.
    /// </summary>
    public static class FeatureToggleKeys
    {
        /// <summary>
        /// Gates the whole fleet/trip module: Trip, TripLeg, Passenger, Driver, Vehicle, FuelLog,
        /// VehicleMaintenance, ServiceOrder, Commission, and Quotes of type Trip.
        /// </summary>
        public const string FleetModule = "FleetModule";
    }
}
