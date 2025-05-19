// TaskService/Models/Backlog.cs
using System.ComponentModel.DataAnnotations;

namespace TaskService.Models
{
    public class Backlog
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }
        [Required]
        public int ProjectId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TaskBacklog> TaskBacklogs { get; set; } = new List<TaskBacklog>();
    }
}


