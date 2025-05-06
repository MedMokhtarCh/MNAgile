using Microsoft.EntityFrameworkCore;
using TaskService.Models;
using Task = TaskService.Models.Task;

namespace TaskService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Task> Tasks { get; set; }
        public DbSet<KanbanColumn> KanbanColumns { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Task>()
                .Property(t => t.AssignedUserIds)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<Task>()
                .Property(t => t.Attachments)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<Task>()
                .Property(t => t.ProjectId)
                .IsRequired();

            modelBuilder.Entity<KanbanColumn>()
                .Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<KanbanColumn>()
                .Property(c => c.ProjectId)
                .IsRequired();

            // Ensure unique column names per project
            modelBuilder.Entity<KanbanColumn>()
                .HasIndex(c => new { c.ProjectId, c.Name })
                .IsUnique();
        }
    }
}