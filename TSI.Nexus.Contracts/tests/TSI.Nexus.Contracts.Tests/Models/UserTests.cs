using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class UserTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var createDate = DateTime.UtcNow.AddDays(-30);
            var modifyDate = DateTime.UtcNow;
            var attachments = new List<Attachment> { new Attachment() };
            var createdEvents = new List<Event> { new Event() };
            var eventParticipations = new List<EventParticipant> { new EventParticipant() };

            var user = new User
            {
                UserName = "johndoe",
                Email = "john.doe@example.com",
                FirstName = "John",
                LastName = "Doe",
                Photo = "photo.png",
                Theme = "dark",
                Language = "en",
                Role = "Admin",
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Attachments = attachments,
                CreatedEvents = createdEvents,
                EventParticipations = eventParticipations,
            };

            user.UserName.Should().Be("johndoe");
            user.Email.Should().Be("john.doe@example.com");
            user.FirstName.Should().Be("John");
            user.LastName.Should().Be("Doe");
            user.Photo.Should().Be("photo.png");
            user.Theme.Should().Be("dark");
            user.Language.Should().Be("en");
            user.Role.Should().Be("Admin");
            user.CreateDate.Should().Be(createDate);
            user.CreateUserId.Should().Be("creator");
            user.ModifyDate.Should().Be(modifyDate);
            user.ModifyUserId.Should().Be("modifier");
            user.Attachments.Should().BeSameAs(attachments);
            user.CreatedEvents.Should().BeSameAs(createdEvents);
            user.EventParticipations.Should().BeSameAs(eventParticipations);
        }
    }
}
