namespace DiscussionService.DTOs
{
    public class ChannelDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public int CreatorId { get; set; } // Changed to non-nullable
        public DateTime CreatedAt { get; set; }
        public int UnreadCount { get; set; }
        public List<int> MemberIds { get; set; }
    }

    public class MessageDTO
    {
        public int Id { get; set; }
        public int ChannelId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public int? ReplyToId { get; set; }
        public int? RecipientId { get; set; }
        public List<MessageAttachmentDTO> Attachments { get; set; }
    }

    public class MessageAttachmentDTO
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileType { get; set; }
        public string FileUrl { get; set; }
        public long FileSize { get; set; }
    }

    public class CreateChannelRequest
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public List<int> MemberIds { get; set; }
    }

    public class SendMessageRequest
    {
        public int ChannelId { get; set; }
        public string Content { get; set; }
        public int? ReplyToId { get; set; }
        public int? RecipientId { get; set; }

    }

    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateChannelRequest
    {
        public string Name { get; set; }
        public List<int> MemberIdsToAdd { get; set; }
        public List<int> MemberIdsToRemove { get; set; } // Added to support member removal
    }
}