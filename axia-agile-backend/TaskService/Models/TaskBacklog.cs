// TaskService/Models/TaskBacklog.cs
namespace TaskService.Models
{
    public class TaskBacklog
    {
        public int TaskId { get; set; }
        public Task Task { get; set; }
        public int BacklogId { get; set; }
        public Backlog Backlog { get; set; }
    }
}