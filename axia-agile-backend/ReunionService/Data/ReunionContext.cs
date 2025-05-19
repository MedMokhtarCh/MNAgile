using Microsoft.EntityFrameworkCore;
using ReunionService.Models;

namespace ReunionService.Data;

public class ReunionContext : DbContext
{
    public ReunionContext(DbContextOptions<ReunionContext> options) : base(options) { }

    public DbSet<Reunion> Reunions { get; set; }
}