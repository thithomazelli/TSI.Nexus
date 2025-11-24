using System.ComponentModel.DataAnnotations.Schema;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Address : BaseModel
    {
        public int Id { get; set; }

        public string Street { get; set; }

        public int Number { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string ZipCode { get; set; }

        public string Country { get; set; }

        public string Comments { get; set; }

        public AddressType AddressType { get; set; }

        [ForeignKey("Person")]
        public int PersonId { get; set; }

        public Person Person { get; set; }
    }
}
