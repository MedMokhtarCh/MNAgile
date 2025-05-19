using System.ComponentModel.DataAnnotations;

namespace DiscussionService.Models
{
    public class Channel
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public string Type { get; set; } // "channel" or "dm"
        public int CreatorId { get; set; } // Changed to non-nullable
        public DateTime CreatedAt { get; set; }
        public ICollection<ChannelMember> Members { get; set; }
        public ICollection<Message> Messages { get; set; }
    }

    public class ChannelMember
    {
        public int ChannelId { get; set; }
        public Channel Channel { get; set; }
        public int UserId { get; set; }
        public int UnreadCount { get; set; }
    }

    public class Message
    {
        public int Id { get; set; }
        public int ChannelId { get; set; }
        public Channel Channel { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public int? ReplyToId { get; set; }
        public Message ReplyTo { get; set; }
        public int? RecipientId { get; set; } // For DMs
        public ICollection<MessageAttachment> Attachments { get; set; }
    }

    public class MessageAttachment
    {
        public int Id { get; set; }
        public int MessageId { get; set; }
        public Message Message { get; set; }
        public string FileName { get; set; }
        public string FileType { get; set; }
        public string FilePath { get; set; }
        public long FileSize { get; set; }
    }
}