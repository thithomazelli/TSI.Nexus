using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Company : Person
    {
        public PersonType Type { get; } = PersonType.Company;

        public string NationalRegistry  { get; set; }

        public string StateRegistration { get; set; }

        public string BusinessName { get; set; }
    }
}
