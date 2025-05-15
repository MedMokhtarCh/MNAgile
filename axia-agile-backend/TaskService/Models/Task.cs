using System;
using System.Collections.Generic;
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
        public string AssignedUserIds { get; set; }
        public string? Attachments { get; set; }
        [Required]
        public int ProjectId { get; set; }
        public List<TaskBacklog>? TaskBacklogs { get; set; } = new List<TaskBacklog>();
        public string? Subtasks { get; set; } // JSON-serialized list of subtask titles
        public int? SprintId { get; set; } // Link to Sprint
    }
}