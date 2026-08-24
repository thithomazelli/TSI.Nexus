namespace TSI.Nexus.Contracts.Models.DTOs
{
    public class UserDto
    {
        public string Id { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public bool EmailConfirmed { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string JWT { get; set; }

        public string Photo { get; set; }

        public string Role { get; set; }
    }
}
