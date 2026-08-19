using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
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

        public SelectableOption() { }
    }
}
