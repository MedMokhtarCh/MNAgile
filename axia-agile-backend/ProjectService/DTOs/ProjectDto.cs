namespace ProjectService.DTOs
{
    public class ProjectDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Methodology { get; set; }
        public string CreatedBy { get; set; }
        public List<string>? ProjectManagers { get; set; } = new List<string>();
        public List<string>? ProductOwners { get; set; } = new List<string>();
        public List<string>? ScrumMasters { get; set; } = new List<string>();
        public List<string>? Developers { get; set; } = new List<string>();
        public List<string>? Testers { get; set; } = new List<string>();
        public List<string>? Observers { get; set; } = new List<string>();
    }
}