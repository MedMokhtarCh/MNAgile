namespace ProjectService.DTOs
{
    public class UpdateProjectDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Methodology { get; set; }
        public List<string>? ProjectManagers { get; set; }
        public List<string>? ProductOwners { get; set; }
        public List<string>? ScrumMasters { get; set; }
        public List<string>? Developers { get; set; }
        public List<string>? Testers { get; set; }
        public List<string>? Observers { get; set; }
    }
}