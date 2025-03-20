namespace UserService.Models
{
    public class Claim
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<UserClaim> UserClaims { get; set; } = new List<UserClaim>();
    }
}
