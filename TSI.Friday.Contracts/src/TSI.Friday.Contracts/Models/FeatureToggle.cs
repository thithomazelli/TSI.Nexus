namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// A module switch controlled exclusively by the Master role. When Enabled is false, every
    /// record belonging to that module is excluded from every read the API serves - it is never
    /// deleted, and reappears automatically once the module is turned back on.
    /// </summary>
    public class FeatureToggle : BaseModel
    {
        /// <summary>
        /// Stable machine key used by the backend to look the toggle up. See
        /// <see cref="FeatureToggleKeys"/> for the known values.
        /// </summary>
        public string Key { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool Enabled { get; set; }

        /// <summary>
        /// Key of the group this toggle belongs to (see <see cref="FeatureToggleKeys"/>), used to
        /// render the grouped admin view. Null for group-level toggles themselves.
        /// </summary>
        public string? GroupKey { get; set; }
    }
}
