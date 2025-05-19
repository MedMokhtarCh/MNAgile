using UserService.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PhoneNumber { get; set; }
    public string? JobTitle { get; set; }
    public string? Entreprise { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? LastLogin { get; set; }
    public int RoleId { get; set; }
    public Role Role { get; set; }
    public List<UserClaim> UserClaims { get; set; }
    public int? CreatedById { get; set; } // Add this property

}