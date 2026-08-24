using System;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models
{
    public class Address : BaseModel
    {
        public string Name { get; set; }

        public string Street { get; set; }

        public int Number { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string ZipCode { get; set; }

        public string Country { get; set; }

        public string Comments { get; set; }

        public AddressType Type { get; set; }

        public bool IsDefault { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }
    }
}
