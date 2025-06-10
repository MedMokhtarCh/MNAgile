namespace UserService.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CreatedByUserId { get; set; } 
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}