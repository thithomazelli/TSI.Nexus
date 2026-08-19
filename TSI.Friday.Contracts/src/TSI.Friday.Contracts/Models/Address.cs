using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
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

        // Was an AddressType enum (Home/Office/Mailing/Billing/Shipping) - now a free-text value
        // matching one of the admin-managed SelectableOption rows for the AddressType group, the
        // same way Product.Category and Transaction.Category already work.
        public string Type { get; set; }

        public bool IsDefault { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public BusinessPartner BusinessPartner { get; set; }
    }
}
