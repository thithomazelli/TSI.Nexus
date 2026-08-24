using System.ComponentModel.DataAnnotations;

namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [RegularExpression(
            @"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$",
            ErrorMessage = "Endereço de e-mail inválido."
        )]
        public string Email { get; set; }

        [Required(ErrorMessage = "É preciso informar uma nova senha.")]
        [StringLength(
            15,
            MinimumLength = 6,
            ErrorMessage = "A senha precisa ter no mínimo {2} e no máximo {1} caracteres."
        )]
        public string NewPassword { get; set; }
    }
}
