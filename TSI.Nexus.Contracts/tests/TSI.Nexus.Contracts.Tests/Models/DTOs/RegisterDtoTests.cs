using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class RegisterDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new RegisterDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "password1",
                Role = "Admin",
            };

            dto.FirstName.Should().Be("John");
            dto.LastName.Should().Be("Doe");
            dto.Email.Should().Be("john.doe@example.com");
            dto.Password.Should().Be("password1");
            dto.Role.Should().Be("Admin");
        }
    }
}
