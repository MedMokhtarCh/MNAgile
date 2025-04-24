using System.Text.Json.Serialization;

namespace ProfileService.DTOs
{
    public class UserDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("firstName")]
        public string FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string LastName { get; set; }

        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; }

        [JsonPropertyName("jobTitle")]
        public string JobTitle { get; set; }

        [JsonPropertyName("entreprise")]
        public string Entreprise { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime DateCreated { get; set; }

        [JsonPropertyName("lastLogin")]
        public DateTime? LastLogin { get; set; }

        [JsonPropertyName("roleId")]
        public int RoleId { get; set; }

        [JsonPropertyName("claimIds")]
        public List<int> ClaimIds { get; set; } = new List<int>();

        [JsonPropertyName("claims")]
        public List<ClaimDTO> Claims { get; set; } = new List<ClaimDTO>();
    }

    public class ClaimDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }
    }
}