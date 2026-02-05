using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Address : BaseModel
    {
        public int Id { get; set; }

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

        [ForeignKey("Client")]
        public int ClientId { get; set; }

        public Client Client { get; set; }
    }
}
