using System.ComponentModel.DataAnnotations;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class ConfirmEmailDto
    {
        [Required]
        public string Token { get; set; }

        [Required]
        [RegularExpression(@"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$", ErrorMessage = "Invalid email address")]
        public string Email { get; set; }
    }
}
