using System;

namespace TSI.Nexus.Contracts.Models
{
    public class Individual : BusinessPartner
    {
        public string SocialSecurityCard { get; set; }

        public string NationalIdCard { get; set; }

        public DateTime Birthday { get; set; }
    }
}
