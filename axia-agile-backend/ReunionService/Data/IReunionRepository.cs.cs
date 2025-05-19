using ReunionService.Models;

namespace ReunionService.Data;

public interface IReunionRepository
{
    Task AddReunionAsync(Reunion reunion);
    Task<List<Reunion>> GetReunionsByUserAsync(string userId);
    Task DeleteReunionAsync(string id, string userId);
}