namespace ReunionService.DTOs
{
    public class CreateReunionRequest
    {
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
