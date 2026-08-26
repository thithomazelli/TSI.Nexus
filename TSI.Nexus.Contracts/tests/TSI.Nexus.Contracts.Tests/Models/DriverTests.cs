using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class DriverTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var birthday = new DateTime(1990, 5, 1);
            var licenseExpiryDate = DateTime.UtcNow.AddYears(3);
            var admissionDate = DateTime.UtcNow.AddYears(-1);
            var trips = new List<Trip> { new Trip() };
            var serviceOrders = new List<ServiceOrder> { new ServiceOrder() };
            var tripDrivers = new List<TripDriver> { new TripDriver() };
            var attachments = new List<Attachment> { new Attachment() };
            var events = new List<Event> { new Event() };

            var driver = new Driver
            {
                Name = "Carlos",
                Email = "carlos@example.com",
                Phone = "1234-5678",
                Mobile = "91234-5678",
                Photo = "photo.png",
                SocialSecurityCard = "SSC-1",
                NationalIdCard = "NIC-1",
                Birthday = birthday,
                LicenseNumber = "LIC-1",
                LicenseCategory = "D",
                LicenseExpiryDate = licenseExpiryDate,
                EmploymentType = EmploymentType.CLT,
                AdmissionDate = admissionDate,
                Status = DriverStatus.Active,
                CommissionPercentage = 12.5m,
                Trips = trips,
                ServiceOrders = serviceOrders,
                TripDrivers = tripDrivers,
                Attachments = attachments,
                Events = events,
            };

            driver.Name.Should().Be("Carlos");
            driver.Email.Should().Be("carlos@example.com");
            driver.Phone.Should().Be("1234-5678");
            driver.Mobile.Should().Be("91234-5678");
            driver.Photo.Should().Be("photo.png");
            driver.SocialSecurityCard.Should().Be("SSC-1");
            driver.NationalIdCard.Should().Be("NIC-1");
            driver.Birthday.Should().Be(birthday);
            driver.LicenseNumber.Should().Be("LIC-1");
            driver.LicenseCategory.Should().Be("D");
            driver.LicenseExpiryDate.Should().Be(licenseExpiryDate);
            driver.EmploymentType.Should().Be(EmploymentType.CLT);
            driver.AdmissionDate.Should().Be(admissionDate);
            driver.Status.Should().Be(DriverStatus.Active);
            driver.CommissionPercentage.Should().Be(12.5m);
            driver.Trips.Should().BeSameAs(trips);
            driver.ServiceOrders.Should().BeSameAs(serviceOrders);
            driver.TripDrivers.Should().BeSameAs(tripDrivers);
            driver.Attachments.Should().BeSameAs(attachments);
            driver.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void CollectionProperties_DefaultToEmptyCollections()
        {
            var driver = new Driver();

            driver.Trips.Should().NotBeNull().And.BeEmpty();
            driver.ServiceOrders.Should().NotBeNull().And.BeEmpty();
            driver.TripDrivers.Should().NotBeNull().And.BeEmpty();
        }
    }
}
