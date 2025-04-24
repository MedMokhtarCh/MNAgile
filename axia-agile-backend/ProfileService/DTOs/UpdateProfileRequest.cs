namespace ProfileService.DTOs
{
    public class UpdateProfileRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string JobTitle { get; set; }
    }
}