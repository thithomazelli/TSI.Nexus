using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class EventParticipantDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var dto = new EventParticipantDto
            {
                Id = id,
                EventId = eventId,
                UserId = "user-1",
                Name = "Convidado",
                Email = "convidado@example.com",
                DisplayName = "John Doe",
            };

            dto.Id.Should().Be(id);
            dto.EventId.Should().Be(eventId);
            dto.UserId.Should().Be("user-1");
            dto.Name.Should().Be("Convidado");
            dto.Email.Should().Be("convidado@example.com");
            dto.DisplayName.Should().Be("John Doe");
        }
    }
}
