// TaskService/DTOs/BacklogDTO.cs
namespace TaskService.DTOs
{
    public class BacklogDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int ProjectId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<int> TaskIds { get; set; } = new List<int>();
    }

    public class CreateBacklogRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int ProjectId { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom du backlog est requis.");
            if (ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
        }
    }

    public class UpdateBacklogRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom du backlog est requis.");
        }
    }
}