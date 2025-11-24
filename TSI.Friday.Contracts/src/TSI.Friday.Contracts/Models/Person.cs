using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TSI.Friday.Contracts.Models
{
    public abstract class Person : BaseModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        [Required]
        [RegularExpression(@"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$", ErrorMessage = "Invalid email address")]
        public string Email { get; set; }

        public string Phone { get; set; }

        public ICollection<Address> Addresses { get; set; }
    }
}
