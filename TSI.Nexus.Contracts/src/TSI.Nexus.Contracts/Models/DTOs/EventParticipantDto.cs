using System;

namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class EventParticipantDto
    {
        public Guid Id { get; set; }

        public Guid EventId { get; set; }

        public string UserId { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        // Computed: User.FirstName + " " + User.LastName when UserId is set, otherwise Name/Email.
        public string DisplayName { get; set; }
    }
}
