using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class LoginDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new LoginDto { UserName = "johndoe", Password = "secret" };

            dto.UserName.Should().Be("johndoe");
            dto.Password.Should().Be("secret");
        }
    }
}
