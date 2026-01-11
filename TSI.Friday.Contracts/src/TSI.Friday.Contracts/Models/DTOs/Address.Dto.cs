using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class AddressDto
    {
        public int Id { get; set; }

        public string Street { get; set; }

        public int Number { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string ZipCode { get; set; }

        public string Country { get; set; }

        public string Comments { get; set; }

        public AddressType Type { get; set; }

        public int ClientId { get; set; }

        public bool IsDefault { get; set; }
    }
}
