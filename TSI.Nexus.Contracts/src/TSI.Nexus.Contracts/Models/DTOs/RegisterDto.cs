using System.ComponentModel.DataAnnotations;

namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(15, MinimumLength = 3, ErrorMessage = "Nome precisa ter no mínimo {2} e no máximo {1} caracteres.")]
        public string FirstName { get; set; }

        [Required]
        [StringLength(15, MinimumLength = 3, ErrorMessage = "Sobrenome precisa ter no mínimo {2} e no máximo {1} caracteres.")]
        public string LastName { get; set; }

        [Required]
        [RegularExpression(@"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$", ErrorMessage  = "Invalid email address")]
        public string Email { get; set; }

        [Required]
        [StringLength(15, MinimumLength = 6, ErrorMessage = "Senha precisa ter no mínimo {2} e no máximo {1} caracteres.")]
        public string Password { get; set; }

        /// <summary>
        /// Optional role to assign to the created user (e.g. "Admin" or "User").
        /// </summary>
        public string Role { get; set; }
    }
}
