using Microsoft.EntityFrameworkCore;
using ReunionService.Models;

namespace ReunionService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Reunion> Reunions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Reunion>()
                .HasIndex(r => r.MeetingUri)
                .IsUnique();

            modelBuilder.Entity<Reunion>()
                .Property(r => r.CalendarEventId)
                .IsRequired(false);
        }
    }
}