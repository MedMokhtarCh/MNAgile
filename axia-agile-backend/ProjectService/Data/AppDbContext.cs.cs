using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using ProjectService.Models;

namespace ProjectService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Project> Projects { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration pour stocker les listes d'emails en tant que JSON
            modelBuilder.Entity<Project>()
                .Property(p => p.Developers)
                .HasConversion(
                    v => string.Join(',', v), // Convertir la liste en chaîne
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() // Convertir la chaîne en liste
                );

            modelBuilder.Entity<Project>()
                .Property(p => p.Testers)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                );
        }
    }
}