using System;
using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class BusinessPartnerDto
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }

        public string Mobile { get; set; }

        public string Photo { get; set; }

        public string DocumentType { get; set; }

        public BusinessPartnerType Type { get; set; }

        public string SocialSecurityCard { get; set; }

        public string NationalRegistry { get; set; }

        public string NationalIdCard { get; set; }

        public DateTime? Birthday { get; set; }

        public ICollection<AddressDto> Addresses { get; set; } = [];
    }
}
