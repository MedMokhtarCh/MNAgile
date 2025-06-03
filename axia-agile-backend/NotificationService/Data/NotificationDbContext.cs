using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;

namespace NotificationService.Data
{
    public class NotificationDbContext : DbContext
    {
        public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options) { }
        public DbSet<Notification> Notifications { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Notification>()
                .HasKey(n => n.Id);

            modelBuilder.Entity<Notification>()
                .Property(n => n.Type)
                .IsRequired();

            modelBuilder.Entity<Notification>()
                .Property(n => n.Message)
                .IsRequired();
        }
    }
    

    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } // e.g., "ProjectAdded", "TaskAssigned", "ChannelMention"
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? RelatedEntityType { get; set; } // e.g., "Project", "Task", "Channel"
        public int? RelatedEntityId { get; set; }
        public int? SenderId { get; set; } // Sender (nullable)

    }
}