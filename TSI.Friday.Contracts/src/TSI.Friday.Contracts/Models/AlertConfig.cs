namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// Configuration for one of the system's automated alerts (overdue checks, expiry warnings).
    /// Lets Master turn an alert off entirely, and - for alerts that warn ahead of a date instead
    /// of just flagging something already overdue - configure how many days ahead to warn.
    /// </summary>
    public class AlertConfig : BaseModel
    {
        /// <summary>
        /// Stable machine key used by the backend to look the config up. See
        /// <see cref="AlertConfigKeys"/> for the known values.
        /// </summary>
        public string Key { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool Enabled { get; set; } = true;

        /// <summary>
        /// How many days ahead of the trigger date this alert should start warning. Null for
        /// alerts that only fire once something is already overdue (no lead time to configure).
        /// </summary>
        public int? ThresholdDays { get; set; }
    }
}
