using Microsoft.EntityFrameworkCore;
using DiscussionService.Models;

namespace DiscussionService.Data
{
    public class DiscussionDbContext : DbContext
    {
        public DiscussionDbContext(DbContextOptions<DiscussionDbContext> options) : base(options) { }

        public DbSet<Channel> Channels { get; set; }
        public DbSet<ChannelMember> ChannelMembers { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageAttachment> MessageAttachments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ChannelMember>()
                .HasKey(cm => new { cm.ChannelId, cm.UserId });

            modelBuilder.Entity<ChannelMember>()
                .HasOne(cm => cm.Channel)
                .WithMany(c => c.Members)
                .HasForeignKey(cm => cm.ChannelId);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Channel)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ChannelId);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.ReplyTo)
                .WithMany()
                .HasForeignKey(m => m.ReplyToId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MessageAttachment>()
                .HasOne(ma => ma.Message)
                .WithMany(m => m.Attachments)
                .HasForeignKey(ma => ma.MessageId);
        }
    }
}