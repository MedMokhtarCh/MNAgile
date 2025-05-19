using Microsoft.EntityFrameworkCore;
using ReunionService.Models;

namespace ReunionService.Data;

public class ReunionRepository : IReunionRepository
{
    private readonly ReunionContext _context;

    public ReunionRepository(ReunionContext context)
    {
        _context = context;
    }

    public async Task AddReunionAsync(Reunion reunion)
    {
        await _context.Reunions.AddAsync(reunion);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Reunion>> GetReunionsByUserAsync(string userId)
    {
        return await _context.Reunions
            .Where(r => r.UserId == userId)
            .ToListAsync();
    }

    public async Task DeleteReunionAsync(string id, string userId)
    {
        var reunion = await _context.Reunions
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (reunion != null)
        {
            _context.Reunions.Remove(reunion);
            await _context.SaveChangesAsync();
        }
    }
}