namespace UserService.DTOs
{
    public class SignupRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Entreprise { get; set; }
        public string Plan { get; set; } // "monthly", "quarterly", "semiannual", "annual"
    }
}