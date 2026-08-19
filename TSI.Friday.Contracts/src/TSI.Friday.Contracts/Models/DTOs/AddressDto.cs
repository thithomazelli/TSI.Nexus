using System;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class AddressDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public string Street { get; set; }

        public int Number { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string ZipCode { get; set; }

        public string Country { get; set; }

        public string Comments { get; set; }

        public string Type { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public bool IsDefault { get; set; }
    }
}
