using System;
using System.ComponentModel.DataAnnotations;

namespace TaskService.Models
{
    public class Task
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string AssignedUserIds { get; set; } // Comma-separated, e.g., "1,2,3"
        public string? Attachments { get; set; } // JSON array, e.g., [{"FileName":"file1.pdf","FilePath":"/Uploads/file1.pdf"}]
        [Required]
        public int ProjectId { get; set; } // Foreign key to Project
    }
}