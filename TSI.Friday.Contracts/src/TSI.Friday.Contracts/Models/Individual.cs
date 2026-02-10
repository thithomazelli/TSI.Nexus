using System;

namespace TSI.Friday.Contracts.Models
{
    public class Individual : Client
    {
        public string SocialSecurityCard { get; set; }

        public string NationalIdCard { get; set; }

        public DateTime Birthday { get; set; }
    }
}
