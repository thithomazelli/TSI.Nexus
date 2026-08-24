using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models
{
    public class Company : BusinessPartner
    {
        public string NationalRegistry  { get; set; }

        public string StateRegistration { get; set; }

        public string BusinessName { get; set; }
    }
}
