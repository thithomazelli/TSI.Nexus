using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class ResetPasswordDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new ResetPasswordDto
            {
                Email = "user@example.com",
                NewPassword = "newSecret1",
            };

            dto.Email.Should().Be("user@example.com");
            dto.NewPassword.Should().Be("newSecret1");
        }
    }
}
