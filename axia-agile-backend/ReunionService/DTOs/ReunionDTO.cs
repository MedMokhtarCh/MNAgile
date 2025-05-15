namespace ReunionService.DTOs
{


    public class ReunionDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string MeetingUri { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string CalendarEventId { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}