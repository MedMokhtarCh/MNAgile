using Microsoft.EntityFrameworkCore;
using UserService.Models;

namespace UserService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Claim> Claims { get; set; }
        public DbSet<UserClaim> UserClaims { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "SuperAdmin" },
                new Role { Id = 2, Name = "Admin" },
                new Role { Id = 3, Name = "ChefProjet" },
                new Role { Id = 4, Name = "User" }
            );

            // Seed claims
            modelBuilder.Entity<Claim>().HasData(
                new Claim { Id = 1, Name = "CanCreateUsers", Description = "Permission de créer des utilisateurs" },
                new Claim { Id = 2, Name = "CanEditUsers", Description = "Permission de modifier des utilisateurs" },
                new Claim { Id = 3, Name = "CanCreateProject", Description = "Permission de créer des projets" },
                new Claim { Id = 4, Name = "CanEditProject", Description = "Permission de modifier des projets" }
            );

            // Configure composite key for UserClaim
            modelBuilder.Entity<UserClaim>()
                .HasKey(uc => new { uc.UserId, uc.ClaimId });

            modelBuilder.Entity<UserClaim>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.UserClaims)
                .HasForeignKey(uc => uc.UserId);

            modelBuilder.Entity<UserClaim>()
                .HasOne(uc => uc.Claim)
                .WithMany(c => c.UserClaims)
                .HasForeignKey(uc => uc.ClaimId);
        }
    }
}