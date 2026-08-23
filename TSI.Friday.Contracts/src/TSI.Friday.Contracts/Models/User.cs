using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace TSI.Friday.Contracts.Models
{
    public class User : IdentityUser
    {
        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        public string Photo { get; set; }

        /// <summary>UI theme preference ("light" or "dark"). Null defaults to "light".</summary>
        public string Theme { get; set; }

        /// <summary>UI language preference ("pt-BR", "en" or "es"). Null defaults to "pt-BR".</summary>
        public string Language { get; set; }

        // NotMapped so EF won't create a dedicated column for this helper property.
        [NotMapped]
        public string Role { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime CreateDate { get; set; }

        public string CreateUserId { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime ModifyDate { get; set; }

        public string ModifyUserId { get; set; }

        public ICollection<Attachment> Attachments { get; set; }

        public ICollection<Event> CreatedEvents { get; set; }

        public ICollection<EventParticipant> EventParticipations { get; set; }
    }
}
