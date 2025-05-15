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
        public DbSet<Backlog> Backlogs { get; set; }
        public DbSet<TaskBacklog> TaskBacklogs { get; set; }
        public DbSet<Sprint> Sprints { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Task configuration
            modelBuilder.Entity<Task>()
                .Property(t => t.AssignedUserIds)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<Task>()
                .Property(t => t.Attachments)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<Task>()
                .Property(t => t.Subtasks)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<Task>()
                .Property(t => t.ProjectId)
                .IsRequired();

            // KanbanColumn configuration
            modelBuilder.Entity<KanbanColumn>()
                .Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<KanbanColumn>()
                .Property(c => c.ProjectId)
                .IsRequired();

            modelBuilder.Entity<KanbanColumn>()
                .HasIndex(c => new { c.ProjectId, c.Name })
                .IsUnique();

            // Backlog configuration
            modelBuilder.Entity<Backlog>()
                .Property(b => b.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<Backlog>()
                .Property(b => b.ProjectId)
                .IsRequired();

            modelBuilder.Entity<Backlog>()
                .HasIndex(b => new { b.ProjectId, b.Name })
                .IsUnique();

            // TaskBacklog configuration
            modelBuilder.Entity<TaskBacklog>()
                .HasKey(tb => new { tb.TaskId, tb.BacklogId });

            modelBuilder.Entity<TaskBacklog>()
                .HasOne(tb => tb.Task)
                .WithMany(t => t.TaskBacklogs)
                .HasForeignKey(tb => tb.TaskId);

            modelBuilder.Entity<TaskBacklog>()
                .HasOne(tb => tb.Backlog)
                .WithMany(b => b.TaskBacklogs)
                .HasForeignKey(tb => tb.BacklogId);

            // Sprint configuration
            modelBuilder.Entity<Sprint>()
                .Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<Sprint>()
                .Property(s => s.ProjectId)
                .IsRequired();

            modelBuilder.Entity<Sprint>()
                .HasIndex(s => new { s.ProjectId, s.Name })
                .IsUnique();

            modelBuilder.Entity<Sprint>()
                .HasMany(s => s.Tasks)
                .WithOne()
                .HasForeignKey(t => t.SprintId);
        }
    }
}