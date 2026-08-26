using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AddressTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var businessPartner = new Individual();
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-2);
            var modifyDate = DateTime.UtcNow;

            var address = new Address
            {
                Id = id,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Name = "Home",
                Street = "Main St",
                Number = 123,
                City = "Springfield",
                State = "SP",
                ZipCode = "12345-678",
                Country = "Brazil",
                Comments = "Leave at door",
                Type = "Residential",
                IsDefault = true,
                BusinessPartnerId = businessPartnerId,
                BusinessPartner = businessPartner,
            };

            address.Id.Should().Be(id);
            address.CreateDate.Should().Be(createDate);
            address.CreateUserId.Should().Be("creator");
            address.ModifyDate.Should().Be(modifyDate);
            address.ModifyUserId.Should().Be("modifier");
            address.Name.Should().Be("Home");
            address.Street.Should().Be("Main St");
            address.Number.Should().Be(123);
            address.City.Should().Be("Springfield");
            address.State.Should().Be("SP");
            address.ZipCode.Should().Be("12345-678");
            address.Country.Should().Be("Brazil");
            address.Comments.Should().Be("Leave at door");
            address.Type.Should().Be("Residential");
            address.IsDefault.Should().BeTrue();
            address.BusinessPartnerId.Should().Be(businessPartnerId);
            address.BusinessPartner.Should().BeSameAs(businessPartner);
        }
    }
}
