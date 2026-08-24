using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models
{
    public class DocumentTemplate : BaseModel
    {
        public DocumentTemplateType Type { get; set; }

        public string Name { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public DocumentTemplate() { }
    }
}
