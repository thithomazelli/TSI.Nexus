using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class BusinessPartnerDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-5);
            var modifyDate = DateTime.UtcNow;
            var birthday = new DateTime(1990, 1, 1);
            var addresses = new List<AddressDto> { new AddressDto() };
            var nextEmptyTransactionId = Guid.NewGuid();

            var dto = new BusinessPartnerDto
            {
                Id = id,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Name = "Cliente X",
                Email = "cliente@example.com",
                Phone = "1234-5678",
                Mobile = "91234-5678",
                Photo = "photo.png",
                DocumentType = "física",
                Type = BusinessPartnerType.Client,
                SocialSecurityCard = "SSC-1",
                NationalRegistry = "NR-1",
                NationalIdCard = "NIC-1",
                Birthday = birthday,
                Addresses = addresses,
                NextEmptyTransactionId = nextEmptyTransactionId,
            };

            dto.Id.Should().Be(id);
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Name.Should().Be("Cliente X");
            dto.Email.Should().Be("cliente@example.com");
            dto.Phone.Should().Be("1234-5678");
            dto.Mobile.Should().Be("91234-5678");
            dto.Photo.Should().Be("photo.png");
            dto.DocumentType.Should().Be("física");
            dto.Type.Should().Be(BusinessPartnerType.Client);
            dto.SocialSecurityCard.Should().Be("SSC-1");
            dto.NationalRegistry.Should().Be("NR-1");
            dto.NationalIdCard.Should().Be("NIC-1");
            dto.Birthday.Should().Be(birthday);
            dto.Addresses.Should().BeSameAs(addresses);
            dto.NextEmptyTransactionId.Should().Be(nextEmptyTransactionId);
        }

        [Fact]
        public void Addresses_DefaultsToEmptyCollection()
        {
            var dto = new BusinessPartnerDto();

            dto.Addresses.Should().NotBeNull().And.BeEmpty();
        }
    }
}
