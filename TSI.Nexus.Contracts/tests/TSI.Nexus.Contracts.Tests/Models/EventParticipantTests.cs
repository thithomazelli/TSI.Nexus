using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class EventParticipantTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var evt = new Event();
            var user = new User();
            var eventId = Guid.NewGuid();

            var participant = new EventParticipant
            {
                EventId = eventId,
                Event = evt,
                UserId = "user-1",
                User = user,
                Name = "Convidado",
                Email = "convidado@example.com",
            };

            participant.EventId.Should().Be(eventId);
            participant.Event.Should().BeSameAs(evt);
            participant.UserId.Should().Be("user-1");
            participant.User.Should().BeSameAs(user);
            participant.Name.Should().Be("Convidado");
            participant.Email.Should().Be("convidado@example.com");
        }

        [Fact]
        public void DefaultConstructor_LeavesOptionalFieldsNull()
        {
            var participant = new EventParticipant();

            participant.UserId.Should().BeNull();
            participant.User.Should().BeNull();
            participant.Name.Should().BeNull();
            participant.Email.Should().BeNull();
        }
    }
}
