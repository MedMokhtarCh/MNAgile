using Microsoft.EntityFrameworkCore;
using ProfileService.Models;

namespace ProfileService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Profile> Profiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Profile>()
                .HasKey(p => p.UserId);

            modelBuilder.Entity<Profile>()
                .Property(p => p.UserId)
                .ValueGeneratedNever(); // UserId is manually set, not auto-incrementing

            modelBuilder.Entity<Profile>()
                .Property(p => p.ProfilePhotoPath)
                .IsRequired(false); // ProfilePhotoPath is nullable
        }
    }
}