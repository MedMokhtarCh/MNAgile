namespace UserService.Models
{
    public class UserClaim
    {
        public int UserId { get; set; }
        public User User { get; set; }
        public int ClaimId { get; set; }
        public Claim Claim { get; set; }
    }
}