using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class AddressDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();

            var dto = new AddressDto
            {
                Id = id,
                Name = "Home",
                Street = "Main St",
                Number = 123,
                City = "Springfield",
                State = "SP",
                ZipCode = "12345-678",
                Country = "Brazil",
                Comments = "Leave at door",
                Type = "Residential",
                BusinessPartnerId = businessPartnerId,
                IsDefault = true,
            };

            dto.Id.Should().Be(id);
            dto.Name.Should().Be("Home");
            dto.Street.Should().Be("Main St");
            dto.Number.Should().Be(123);
            dto.City.Should().Be("Springfield");
            dto.State.Should().Be("SP");
            dto.ZipCode.Should().Be("12345-678");
            dto.Country.Should().Be("Brazil");
            dto.Comments.Should().Be("Leave at door");
            dto.Type.Should().Be("Residential");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.IsDefault.Should().BeTrue();
        }
    }
}
