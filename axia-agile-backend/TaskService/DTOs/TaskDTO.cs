using System.Text.Json.Serialization;

namespace TaskService.DTOs
{
    public class TaskDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<AttachmentDTO> Attachments { get; set; } = new List<AttachmentDTO>();
        public List<int> AssignedUserIds { get; set; } = new List<int>();
        public List<string?> AssignedUserEmails { get; set; } = new List<string>();
        public int ProjectId { get; set; }
        public List<int>? BacklogIds { get; set; } = new List<int>();
        public List<string>? Subtasks { get; set; } = new List<string>();
        public int? SprintId { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class AttachmentDTO
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public DateTime UploadedAt { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int UploadedByUserId { get; set; }
    }
}