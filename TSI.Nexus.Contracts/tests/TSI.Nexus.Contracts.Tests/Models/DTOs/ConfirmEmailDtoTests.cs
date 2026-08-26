using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class ConfirmEmailDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new ConfirmEmailDto { Token = "abc123", Email = "user@example.com" };

            dto.Token.Should().Be("abc123");
            dto.Email.Should().Be("user@example.com");
        }
    }
}
