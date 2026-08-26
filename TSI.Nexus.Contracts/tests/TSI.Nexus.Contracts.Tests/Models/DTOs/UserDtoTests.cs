using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class UserDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var createDate = DateTime.UtcNow.AddDays(-10);
            var modifyDate = DateTime.UtcNow;

            var dto = new UserDto
            {
                Id = "user-1",
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                UserName = "johndoe",
                Email = "john.doe@example.com",
                EmailConfirmed = true,
                FirstName = "John",
                LastName = "Doe",
                JWT = "token123",
                Photo = "photo.png",
                Role = "Admin",
                Theme = "dark",
                Language = "en",
            };

            dto.Id.Should().Be("user-1");
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.UserName.Should().Be("johndoe");
            dto.Email.Should().Be("john.doe@example.com");
            dto.EmailConfirmed.Should().BeTrue();
            dto.FirstName.Should().Be("John");
            dto.LastName.Should().Be("Doe");
            dto.JWT.Should().Be("token123");
            dto.Photo.Should().Be("photo.png");
            dto.Role.Should().Be("Admin");
            dto.Theme.Should().Be("dark");
            dto.Language.Should().Be("en");
        }
    }
}
