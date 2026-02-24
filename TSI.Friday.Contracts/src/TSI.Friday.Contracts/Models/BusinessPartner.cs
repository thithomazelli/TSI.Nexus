using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public abstract class BusinessPartner : BaseModel
    {
        public string Name { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [RegularExpression(
            @"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$",
            ErrorMessage = "Invalid email address"
        )]
        public string Email { get; set; }

        public string Phone { get; set; }

        public string Mobile { get; set; }

        public string Photo { get; set; }

        public string DocumentType { get; set; }

        public BusinessPartnerType Type { get; set; }

        public ICollection<Address> Addresses { get; set; }

        public ICollection<Order> Orders { get; set; }

        public ICollection<Transaction> Transactions { get; set; }
    }
}
