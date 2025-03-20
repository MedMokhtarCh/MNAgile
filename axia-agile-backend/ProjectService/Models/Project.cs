namespace ProjectService.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Methodology { get; set; } 
        public string CreatedBy { get; set; } 
        public string ProjectManager { get; set; } 
        public string ProductOwner { get; set; } 
        public string ScrumMaster { get; set; } 
        public List<string> Developers { get; set; } = new List<string>(); 
        public List<string> Testers { get; set; } = new List<string>(); 
    }
}