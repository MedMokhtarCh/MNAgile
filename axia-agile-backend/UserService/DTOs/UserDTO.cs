using UserService.Models;

namespace UserService.DTOs
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string JobTitle { get; set; }
        public string Entreprise { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? LastLogin { get; set; }
        public int RoleId { get; set; }
        public int? CreatedById { get; set; }
        public int? RootAdminId { get; set; } 
        public List<int> ClaimIds { get; set; } = new List<int>();
        public List<ClaimDTO> Claims { get; set; } = new List<ClaimDTO>();
        public Subscription Subscription { get; set; }
    }
    public class RenewSubscriptionRequest
    {
        public string Plan { get; set; }
    }

}