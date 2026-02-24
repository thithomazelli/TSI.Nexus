using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Company : BusinessPartner
    {
        public string NationalRegistry  { get; set; }

        public string StateRegistration { get; set; }

        public string BusinessName { get; set; }
    }
}
