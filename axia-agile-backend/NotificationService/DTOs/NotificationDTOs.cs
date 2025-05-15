namespace NotificationService.DTOs
{
    public class NotificationDTO
    {
        public int Id { get; set; }
        public string RecipientEmail { get; set; }
        public SenderDTO Sender { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public bool Read { get; set; }
        public DateTime Timestamp { get; set; }
        public MetadataDTO Metadata { get; set; }
    }

    public class SenderDTO
    {
        public string Name { get; set; }
        public string Avatar { get; set; }
    }

    public class MetadataDTO
    {
        public int? ProjectId { get; set; }
        public int? TaskId { get; set; }
    }

    public class CreateNotificationRequest
    {
        public string RecipientEmail { get; set; }
        public string SenderName { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public MetadataDTO Metadata { get; set; }
    }
}