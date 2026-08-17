using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
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
