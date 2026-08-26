using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    // BusinessPartner is abstract - exercised through its concrete Individual subclass, since the
    // properties under test all live on the base class.
    public class BusinessPartnerTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var addresses = new List<Address> { new Address() };
            var orders = new List<Order> { new Order() };
            var transactions = new List<Transaction> { new Transaction() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };

            BusinessPartner businessPartner = new Individual
            {
                Name = "Cliente X",
                Email = "cliente@example.com",
                Phone = "1234-5678",
                Mobile = "91234-5678",
                Photo = "photo.png",
                DocumentType = "física",
                Type = BusinessPartnerType.Client,
                Addresses = addresses,
                Orders = orders,
                Transactions = transactions,
                Attachments = attachments,
                Events = events,
            };

            businessPartner.Name.Should().Be("Cliente X");
            businessPartner.Email.Should().Be("cliente@example.com");
            businessPartner.Phone.Should().Be("1234-5678");
            businessPartner.Mobile.Should().Be("91234-5678");
            businessPartner.Photo.Should().Be("photo.png");
            businessPartner.DocumentType.Should().Be("física");
            businessPartner.Type.Should().Be(BusinessPartnerType.Client);
            businessPartner.Addresses.Should().BeSameAs(addresses);
            businessPartner.Orders.Should().BeSameAs(orders);
            businessPartner.Transactions.Should().BeSameAs(transactions);
            businessPartner.Attachments.Should().BeSameAs(attachments);
            businessPartner.Events.Should().BeSameAs(events);
        }
    }

    public class IndividualTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var birthday = new DateTime(1985, 3, 20);

            var individual = new Individual
            {
                SocialSecurityCard = "SSC-1",
                NationalIdCard = "NIC-1",
                Birthday = birthday,
            };

            individual.SocialSecurityCard.Should().Be("SSC-1");
            individual.NationalIdCard.Should().Be("NIC-1");
            individual.Birthday.Should().Be(birthday);
        }
    }

    public class CompanyTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var company = new Company
            {
                NationalRegistry = "12.345.678/0001-99",
                StateRegistration = "SR-1",
                BusinessName = "Empresa X",
            };

            company.NationalRegistry.Should().Be("12.345.678/0001-99");
            company.StateRegistration.Should().Be("SR-1");
            company.BusinessName.Should().Be("Empresa X");
        }
    }
}
