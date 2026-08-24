using System.Collections.Generic;
using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models
{
    /// <summary>
    /// A single admin-managed value in one of the app's dropdown option lists (address type,
    /// product category, transaction category). Replaces what used to be hardcoded arrays in the
    /// Angular forms.
    /// </summary>
    public class SelectableOption : BaseModel
    {
        public SelectableOptionGroup Group { get; set; }

        public string Value { get; set; } = string.Empty;

        // Only meaningful for Group == EventType (hex color shown on the Agenda calendar for
        // events of this type) - ignored by every other group.
        public string? Color { get; set; }

        public ICollection<Event> Events { get; set; }

        public SelectableOption() { }
    }
}
