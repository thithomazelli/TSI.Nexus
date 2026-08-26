using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class DocumentTemplateTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var template = new DocumentTemplate
            {
                Type = DocumentTemplateType.Quote,
                Name = "Modelo de orçamento",
                FileName = "quote-template.docx",
                Content = "<html></html>",
            };

            template.Type.Should().Be(DocumentTemplateType.Quote);
            template.Name.Should().Be("Modelo de orçamento");
            template.FileName.Should().Be("quote-template.docx");
            template.Content.Should().Be("<html></html>");
        }

        [Fact]
        public void DefaultConstructor_LeavesDefaultsIntact()
        {
            var template = new DocumentTemplate();

            template.Name.Should().BeEmpty();
            template.FileName.Should().BeEmpty();
            template.Content.Should().BeEmpty();
        }
    }
}
