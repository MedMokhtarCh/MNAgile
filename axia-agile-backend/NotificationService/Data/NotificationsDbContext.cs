using Microsoft.EntityFrameworkCore;

namespace NotificationService.Data;

public class NotificationsDbContext(DbContextOptions<NotificationsDbContext> options) : DbContext(options)
{
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>()
            .Property(n => n.Metadata)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, default),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, default));
    }
}