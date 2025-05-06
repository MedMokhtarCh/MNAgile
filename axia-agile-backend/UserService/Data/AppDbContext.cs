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

            // Configure Role entity
            modelBuilder.Entity<Role>(entity =>
            {
                entity.Property(r => r.Id)
                      .ValueGeneratedNever();
                entity.Property(r => r.Name)
                      .IsRequired()
                      .HasMaxLength(100);
            });

            // Configure Claim entity
            modelBuilder.Entity<Claim>(entity =>
            {
                entity.Property(c => c.Id)
                      .ValueGeneratedNever();
                entity.Property(c => c.Name)
                      .IsRequired()
                      .HasMaxLength(100);
                entity.Property(c => c.Description)
                      .IsRequired()
                      .HasMaxLength(500);
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.RoleId)
                      .IsRequired();
                entity.Property(u => u.Email)
                      .IsRequired()
                      .HasMaxLength(256);
                entity.Property(u => u.FirstName)
                      .IsRequired()
                      .HasMaxLength(100);
                entity.Property(u => u.LastName)
                      .IsRequired()
                      .HasMaxLength(100);
                entity.Property(u => u.PhoneNumber)
                      .IsRequired()
                      .HasMaxLength(20);
                entity.Property(u => u.PasswordHash)
                      .IsRequired();
            });

            // Configure User-Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure composite key for UserClaim
            modelBuilder.Entity<UserClaim>()
                .HasKey(uc => new { uc.UserId, uc.ClaimId });

            // Configure UserClaim relationships
            modelBuilder.Entity<UserClaim>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.UserClaims)
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserClaim>()
                .HasOne(uc => uc.Claim)
                .WithMany(c => c.UserClaims)
                .HasForeignKey(uc => uc.ClaimId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "SuperAdmin" },
                new Role { Id = 2, Name = "Admin" },
                new Role { Id = 3, Name = "ChefProjet" },
                new Role { Id = 4, Name = "User" }
            );

            // Seed claims
            modelBuilder.Entity<Claim>().HasData(
                new Claim { Id = 1, Name = "CanViewUsers", Description = "Permission de voir les utilisateurs" },
                new Claim { Id = 2, Name = "CanCreateUsers", Description = "Permission de créer des utilisateurs" },
                new Claim { Id = 3, Name = "CanUpdateUsers", Description = "Permission de mettre à jour les utilisateurs" },
                new Claim { Id = 4, Name = "CanDeleteUsers", Description = "Permission de supprimer des utilisateurs" },
                new Claim { Id = 5, Name = "CanViewProjects", Description = "Permission de voir les projets" },
                new Claim { Id = 6, Name = "CanAddProjects", Description = "Permission d'ajouter des projets" },
                new Claim { Id = 7, Name = "CanEditProjects", Description = "Permission de modifier des projets" },
                new Claim { Id = 8, Name = "CanDeleteProjects", Description = "Permission de supprimer des projets" },
                new Claim { Id = 9, Name = "CanViewTasks", Description = "Permission de voir les tâches" },
                new Claim { Id = 10, Name = "CanCreateTasks", Description = "Permission de créer des tâches" },
                new Claim { Id = 11, Name = "CanUpdateTasks", Description = "Permission de mettre à jour les tâches" },
                new Claim { Id = 12, Name = "CanDeleteTasks", Description = "Permission de supprimer des tâches" }
            );
        }
    }
}