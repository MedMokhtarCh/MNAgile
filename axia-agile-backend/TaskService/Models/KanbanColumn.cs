using System.ComponentModel.DataAnnotations;

namespace TaskService.Models
{
    public class KanbanColumn
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public int ProjectId { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}