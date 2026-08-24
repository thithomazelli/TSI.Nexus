using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    /// <summary>
    /// One participant invited to an Event - either an existing system User (UserId set) or a
    /// freeform contact (Name/Email set, no UserId). Validated in EventParticipantService: exactly
    /// one of those two identifications is required.
    /// </summary>
    public class EventParticipant : BaseModel
    {
        [ForeignKey("Event")]
        public Guid EventId { get; set; }

        public virtual Event Event { get; set; } = null!;

        public string? UserId { get; set; }

        public virtual User? User { get; set; }

        public string? Name { get; set; }

        public string? Email { get; set; }

        public EventParticipant() { }
    }
}
