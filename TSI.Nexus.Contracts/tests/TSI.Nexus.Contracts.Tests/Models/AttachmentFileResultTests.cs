using System.IO;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AttachmentFileResultTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            using var stream = new MemoryStream();

            var result = new AttachmentFileResult
            {
                Stream = stream,
                ContentType = "application/pdf",
                FileName = "document.pdf",
            };

            result.Stream.Should().BeSameAs(stream);
            result.ContentType.Should().Be("application/pdf");
            result.FileName.Should().Be("document.pdf");
        }

        [Fact]
        public void Defaults_MatchDeclaredValues()
        {
            var result = new AttachmentFileResult { Stream = new MemoryStream() };

            result.ContentType.Should().Be("application/octet-stream");
            result.FileName.Should().BeEmpty();
        }
    }
}
