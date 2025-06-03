namespace UserService.Models
{
    public class Subscription
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Plan { get; set; } // e.g., "monthly", "quarterly", "semiannual", "annual"
        public string Status { get; set; } // e.g., "Pending", "Active", "Expired", "Cancelled"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public User User { get; set; }
    }
}