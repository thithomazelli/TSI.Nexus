using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class EmailSendDtoTests
    {
        [Fact]
        public void Constructor_SetsPropertiesFromArguments()
        {
            var dto = new EmailSendDto("to@example.com", "Subject", "Body content");

            dto.To.Should().Be("to@example.com");
            dto.Subject.Should().Be("Subject");
            dto.Body.Should().Be("Body content");
        }

        [Fact]
        public void Properties_CanBeReassignedAfterConstruction()
        {
            var dto = new EmailSendDto("to@example.com", "Subject", "Body content")
            {
                To = "other@example.com",
                Subject = "New subject",
                Body = "New body",
            };

            dto.To.Should().Be("other@example.com");
            dto.Subject.Should().Be("New subject");
            dto.Body.Should().Be("New body");
        }
    }
}
