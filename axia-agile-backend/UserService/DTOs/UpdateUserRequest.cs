namespace UserService.DTOs
{
    public class UpdateUserRequest
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? JobTitle { get; set; }
        public string? Entreprise { get; set; }
        public int RoleId { get; set; } // 0 indicates no change
        public List<int>? ClaimIds { get; set; }
    }
}